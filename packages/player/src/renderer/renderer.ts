import { mat4 } from 'gl-matrix';
import reglInit from 'regl';
import type { Format, Layout } from '../types';
import type { Regl } from 'regl';
import type { RenderProps } from './renderProps';

// fullscreen clip-space quad
const QUAD_POSITIONS = [
  [-1, -1, 0],
  [1, -1, 0],
  [1, 1, 0],
  [-1, 1, 0],
];
const QUAD_INDICES = [
  [0, 1, 2],
  [0, 2, 3],
];

const VERT_SHADER = `
precision highp float;

attribute vec3 position;

varying vec2 clipCoord;

void main() {
  clipCoord = position.xy;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const RAY_PREAMBLE = `
precision highp float;

#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define SPHERE_RADIUS 1.0

uniform mat4 inverseModelViewProjection;
uniform vec3 modelSpaceEye;
uniform sampler2D texture;
uniform mediump vec4 texCoordScaleOffset;

varying vec2 clipCoord;

void getRay(out vec3 rayOrigin, out vec3 rayDir) {
  rayOrigin = modelSpaceEye;
  vec4 nearModel = inverseModelViewProjection * vec4(clipCoord, -1.0, 1.0);
  vec4 farModel  = inverseModelViewProjection * vec4(clipCoord,  1.0, 1.0);
  nearModel /= nearModel.w;
  farModel  /= farModel.w;
  rayDir = normalize(farModel.xyz - nearModel.xyz);
}
`;

// 360°: viewer is always inside the sphere, no discard needed
const FRAG_360 =
  RAY_PREAMBLE +
  `
void main() {
  vec3 rayOrigin, rayDir;
  getRay(rayOrigin, rayDir);

  // Simplified quadratic (rayDir is normalized so a=1)
  float halfB = dot(rayOrigin, rayDir);
  float c = dot(rayOrigin, rayOrigin) - SPHERE_RADIUS * SPHERE_RADIUS;
  float t = -halfB + sqrt(halfB * halfB - c);
  vec3 hit = rayOrigin + t * rayDir;

  float theta = atan(hit.z, hit.x);
  float phi   = asin(clamp(hit.y / SPHERE_RADIUS, -1.0, 1.0));

  mediump vec2 uv = vec2(theta / TWO_PI + 0.5, phi / PI + 0.5);
  mediump vec2 mappedUv = uv * texCoordScaleOffset.xy + texCoordScaleOffset.zw;
  gl_FragColor = texture2D(texture, mappedUv);
}
`;

// 180°: same ray-sphere but discard back hemisphere
const FRAG_180 =
  RAY_PREAMBLE +
  `
void main() {
  vec3 rayOrigin, rayDir;
  getRay(rayOrigin, rayDir);

  float halfB = dot(rayOrigin, rayDir);
  float c = dot(rayOrigin, rayOrigin) - SPHERE_RADIUS * SPHERE_RADIUS;
  float disc = halfB * halfB - c;
  if (disc < 0.0) discard;
  float t = -halfB + sqrt(disc);
  vec3 hit = rayOrigin + t * rayDir;

  float theta = atan(hit.z, hit.x);
  float phi   = asin(clamp(hit.y / SPHERE_RADIUS, -1.0, 1.0));

  mediump vec2 uv = vec2(theta / TWO_PI + 0.5, phi / PI + 0.5);

  // discard back hemisphere
  if (uv.x < 0.25 || uv.x > 0.75) discard;
  // remap [0.25, 0.75] -> [0, 1]
  uv.x = (uv.x - 0.25) * 2.0;

  mediump vec2 mappedUv = uv * texCoordScaleOffset.xy + texCoordScaleOffset.zw;
  gl_FragColor = texture2D(texture, mappedUv);
}
`;

// Screen: ray-plane intersection
const FRAG_SCREEN =
  RAY_PREAMBLE +
  `
void main() {
  vec3 rayOrigin, rayDir;
  getRay(rayOrigin, rayDir);

  // ray-plane intersection: screen quad lies at z = 0, spanning [-1,1] in x and y
  float t = -rayOrigin.z / rayDir.z;
  if (t < 0.0) discard;
  vec3 hit = rayOrigin + t * rayDir;
  if (abs(hit.x) > 1.0 || abs(hit.y) > 1.0) discard;
  mediump vec2 uv = vec2(1.0 - (hit.x * 0.5 + 0.5), hit.y * 0.5 + 0.5);

  mediump vec2 mappedUv = uv * texCoordScaleOffset.xy + texCoordScaleOffset.zw;
  gl_FragColor = texture2D(texture, mappedUv);
}
`;

function getFragShader(format: Format): string {
  switch (format) {
    case '360':
      return FRAG_360;
    case '180':
      return FRAG_180;
    case 'screen':
    // falls through
    default:
      return FRAG_SCREEN;
  }
}

export class VideoFrameTracker {
  private hasNewFrame = true;
  private vfcHandle = 0;
  private stopped = false;

  constructor(private readonly video: HTMLVideoElement) {
    if ('requestVideoFrameCallback' in video) {
      this.hasNewFrame = false;
      this.scheduleCallback();
    }
    // If requestVideoFrameCallback is not supported, hasNewFrame stays true
    // so every render frame will upload the texture (legacy behavior).
  }

  private scheduleCallback() {
    if (this.stopped) return;
    this.vfcHandle = this.video.requestVideoFrameCallback(() => {
      this.hasNewFrame = true;
      this.scheduleCallback();
    });
  }

  consumeFrame(): boolean {
    if (this.hasNewFrame) {
      this.hasNewFrame = false;
      return true;
    }
    return false;
  }

  stop() {
    this.stopped = true;
    if ('cancelVideoFrameCallback' in this.video) {
      this.video.cancelVideoFrameCallback(this.vfcHandle);
    }
  }
}

export abstract class Renderer {
  protected abstract startDrawLoop(): Promise<void>;
  protected abstract stopDrawLoop(): void;

  public async start() {
    await this.startDrawLoop();
  }

  public stop() {
    this.stopDrawLoop();
    this.regl.destroy();
  }

  protected readonly regl: Regl;

  protected readonly cmdRender: reglInit.DrawCommand<
    reglInit.DefaultContext,
    RenderProps
  >;

  constructor(
    protected readonly canvas: HTMLCanvasElement,
    protected readonly layout: Layout,
    protected readonly flipLayout: boolean,
    protected readonly format: Format,
  ) {
    this.regl = reglInit({ pixelRatio: 1, canvas: this.canvas });

    this.cmdRender = this.regl({
      vert: VERT_SHADER,
      frag: getFragShader(this.format),
      attributes: {
        position: QUAD_POSITIONS,
      },
      // TODO: https://github.com/regl-project/regl/pull/632
      uniforms: {
        inverseModelViewProjection: this.regl.prop<
          RenderProps,
          'inverseModelViewProjection'
        >('inverseModelViewProjection'),
        modelSpaceEye: this.regl.prop<RenderProps, 'modelSpaceEye'>(
          'modelSpaceEye',
        ),
        texture: this.regl.prop<RenderProps, 'texture'>('texture'),
        texCoordScaleOffset: this.regl.prop<RenderProps, 'texCoordScaleOffset'>(
          'texCoordScaleOffset',
        ),
      },
      viewport: this.regl.prop<RenderProps, 'viewport'>('viewport'),
      elements: QUAD_INDICES,
    });
  }

  private getAspectRatio(video: HTMLVideoElement) {
    switch (this.layout) {
      case 'stereoLeftRight':
        return (video.videoWidth * 0.5) / video.videoHeight;
      case 'stereoTopBottom':
        return (video.videoWidth / video.videoHeight) * 0.5;
      case 'mono':
      // falls through
      default:
        return video.videoWidth / video.videoHeight;
    }
  }

  protected getModelMatrix(video: HTMLVideoElement) {
    const aspectRatio = this.getAspectRatio(video);

    const model = mat4.create();
    // rotate model 180 deg to flip z axis as WebXR looks towards -z
    // https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Geometry
    mat4.rotateY(model, model, Math.PI);

    if (this.format === 'screen') {
      const screenHeight = 1;

      // scale according to aspect ratio
      mat4.scale(model, model, [screenHeight * aspectRatio, screenHeight, 1]);
      // move screen back a bit
      mat4.translate(model, model, [0, 0, screenHeight]);
    }

    if (this.format !== 'screen') {
      // rotate model 90 deg to look at the center of the video
      mat4.rotateY(model, model, -Math.PI / 2);
    }

    return model;
  }

  protected getInverseModelMatrix(video: HTMLVideoElement): mat4 {
    const inv = mat4.create();
    mat4.invert(inv, this.getModelMatrix(video));
    return inv;
  }

  protected getTexCoordScaleOffsets() {
    let offsets;
    switch (this.layout) {
      case 'stereoLeftRight':
        offsets = [
          new Float32Array([0.5, 1.0, 0.0, 0.0]),
          new Float32Array([0.5, 1.0, 0.5, 0.0]),
        ];
        break;
      case 'stereoTopBottom':
        offsets = [
          new Float32Array([1.0, 0.5, 0.0, 0.0]),
          new Float32Array([1.0, 0.5, 0.0, 0.5]),
        ];
        break;
      case 'mono':
      // falls through
      default:
        offsets = [
          new Float32Array([1.0, 1.0, 0.0, 0.0]),
          new Float32Array([1.0, 1.0, 0.0, 0.0]),
        ];
    }
    if (this.flipLayout) {
      return offsets.reverse();
    }
    return offsets;
  }
}

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

const FORMAT_360 = 0;
const FORMAT_180 = 1;
const FORMAT_SCREEN = 2;

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
      vert: `
      precision highp float;

      attribute vec3 position;

      varying vec2 clipCoord;

      void main() {
        clipCoord = position.xy;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
      `,
      frag: `
      precision highp float;

      #define FORMAT_360  0
      #define FORMAT_180  1
      #define FORMAT_SCREEN 2

      #define PI 3.14159265359
      #define TWO_PI 6.28318530718
      #define SPHERE_RADIUS 1.0

      uniform mat4 inverseViewProjection;
      uniform mat4 inverseModel;
      uniform vec3 eyePosition;
      uniform int format;
      uniform sampler2D texture;
      uniform vec4 texCoordScaleOffset;

      varying vec2 clipCoord;

      void main() {
        // reconstruct world-space ray from clip coords
        vec4 nearWorld = inverseViewProjection * vec4(clipCoord, -1.0, 1.0);
        vec4 farWorld  = inverseViewProjection * vec4(clipCoord,  1.0, 1.0);
        nearWorld /= nearWorld.w;
        farWorld  /= farWorld.w;

        vec3 worldRayDir = normalize(farWorld.xyz - nearWorld.xyz);

        // transform ray into model space
        vec3 rayOrigin = (inverseModel * vec4(eyePosition, 1.0)).xyz;
        vec3 rayDir    = normalize((inverseModel * vec4(worldRayDir, 0.0)).xyz);

        vec2 uv;

        if (format == FORMAT_SCREEN) {
          // ray-plane intersection: screen quad lies at z = 0, spanning [-1,1] in x and y
          float t = -rayOrigin.z / rayDir.z;
          if (t < 0.0) discard;
          vec3 hit = rayOrigin + t * rayDir;
          if (abs(hit.x) > 1.0 || abs(hit.y) > 1.0) discard;
          uv = vec2(1.0 - (hit.x * 0.5 + 0.5), hit.y * 0.5 + 0.5);
        } else {
          // ray-sphere intersection (viewer inside sphere of SPHERE_RADIUS)
          float a = dot(rayDir, rayDir);
          float b = 2.0 * dot(rayOrigin, rayDir);
          float c = dot(rayOrigin, rayOrigin) - SPHERE_RADIUS * SPHERE_RADIUS;
          float disc = b * b - 4.0 * a * c;
          if (disc < 0.0) discard;
          float t = (-b + sqrt(disc)) / (2.0 * a);
          vec3 hit = rayOrigin + t * rayDir;

          // spherical coords to equirectangular UV
          float theta = atan(hit.z, hit.x);         // [-PI, PI]
          float phi   = asin(clamp(hit.y / SPHERE_RADIUS, -1.0, 1.0)); // [-PI/2, PI/2]

          uv = vec2(theta / TWO_PI + 0.5, phi / PI + 0.5);

          if (format == FORMAT_180) {
            // discard back hemisphere
            if (uv.x < 0.25 || uv.x > 0.75) discard;
            // remap [0.25, 0.75] -> [0, 1]
            uv.x = (uv.x - 0.25) * 2.0;
          }
        }

        vec2 mappedUv = uv * texCoordScaleOffset.xy + texCoordScaleOffset.zw;
        gl_FragColor = texture2D(texture, mappedUv);
      }
      `,
      attributes: {
        position: QUAD_POSITIONS,
      },
      // TODO: https://github.com/regl-project/regl/pull/632
      uniforms: {
        inverseViewProjection: this.regl.prop<
          RenderProps,
          'inverseViewProjection'
        >('inverseViewProjection'),
        inverseModel: this.regl.prop<RenderProps, 'inverseModel'>(
          'inverseModel',
        ),
        eyePosition: this.regl.prop<RenderProps, 'eyePosition'>('eyePosition'),
        format: this.regl.prop<RenderProps, 'format'>('format'),
        texture: this.regl.prop<RenderProps, 'texture'>('texture'),
        texCoordScaleOffset: this.regl.prop<RenderProps, 'texCoordScaleOffset'>(
          'texCoordScaleOffset',
        ),
      },
      viewport: this.regl.prop<RenderProps, 'viewport'>('viewport'),
      elements: QUAD_INDICES,
    });
  }

  protected getFormatInt(): number {
    switch (this.format) {
      case '360':
        return FORMAT_360;
      case '180':
        return FORMAT_180;
      case 'screen':
      // falls through
      default:
        return FORMAT_SCREEN;
    }
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

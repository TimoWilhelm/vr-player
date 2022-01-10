import { mat4 } from 'gl-matrix';
import { sphere } from '../primitive';
import { square } from '../primitive/square';
import reglInit from 'regl';
import type { Format } from '../format';
import type { Layout } from '../layout';
import type { Primitive } from '../primitive';
import type { Regl } from 'regl';
import type { RenderProps } from './renderProps';

export abstract class Renderer {
  abstract start(): Promise<void>;

  public stop() {
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
    protected readonly format: Format,
  ) {
    const mesh = this.getMesh();

    this.regl = reglInit({ pixelRatio: 1, canvas: this.canvas });

    this.cmdRender = this.regl({
      vert: `
      precision highp float;

      attribute vec3 position;
      attribute vec2 uv;

      uniform vec4 texCoordScaleOffset;
      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 projection;

      varying vec2 mappedUv;

      void main() {
        gl_Position = projection * view * model * vec4(position, 1);
        mappedUv = uv * texCoordScaleOffset.xy + texCoordScaleOffset.zw;
      }
      `,
      frag: `
      precision highp float;

      uniform sampler2D texture;

      varying vec2 mappedUv;

      void main() {
        gl_FragColor = texture2D(texture, mappedUv);
      }
      `,
      attributes: {
        position: mesh.positions,
        uv: mesh.uvs,
      },
      // TODO: https://github.com/regl-project/regl/pull/632
      uniforms: {
        model: this.regl.prop<RenderProps, 'model'>('model'),
        view: this.regl.prop<RenderProps, 'view'>('view'),
        projection: this.regl.prop<RenderProps, 'projection'>('projection'),
        texture: this.regl.prop<RenderProps, 'texture'>('texture'),
        texCoordScaleOffset: this.regl.prop<RenderProps, 'texCoordScaleOffset'>(
          'texCoordScaleOffset',
        ),
      },
      viewport: this.regl.prop<RenderProps, 'viewport'>('viewport'),
      elements: mesh.indices,
      cull: {
        enable: true,
        face: 'front',
      },
    });
  }

  private getMesh(): Primitive {
    switch (this.format) {
      case '360':
        return sphere({ radius: 1, segments: 32 });
      case '180': {
        return sphere({ radius: 1, segments: 16, halfSphere: true });
      }
      case 'screen':
      // falls through
      default:
        return square({ scale: 1 });
    }
  }

  private getAspectRation(video: HTMLVideoElement) {
    switch (this.layout) {
      case 'stereoTopBottom':
        return (video.videoWidth / video.videoHeight) * 0.5;
      case 'stereoLeftRight':
        return (video.videoWidth * 0.5) / video.videoHeight;
      case 'mono':
      // falls through
      default:
        return video.videoWidth / video.videoHeight;
    }
  }

  protected getModelMatrix(video: HTMLVideoElement) {
    const aspectRatio = this.getAspectRation(video);

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

    if (this.format === '360') {
      // rotate model 90 deg to look at the center of the video
      mat4.rotateY(model, model, -Math.PI / 2);
    }

    return model;
  }

  protected getTexCoordScaleOffsets() {
    switch (this.layout) {
      case 'stereoTopBottom':
        return [
          new Float32Array([1.0, 0.5, 0.0, 0.0]),
          new Float32Array([1.0, 0.5, 0.0, 0.5]),
        ];
      case 'stereoLeftRight':
        return [
          new Float32Array([0.5, 1.0, 0.0, 0.0]),
          new Float32Array([0.5, 1.0, 0.5, 0.0]),
        ];
      case 'mono':
      // falls through
      default:
        return [
          new Float32Array([1.0, 1.0, 0.0, 0.0]),
          new Float32Array([1.0, 1.0, 0.0, 0.0]),
        ];
    }
  }
}

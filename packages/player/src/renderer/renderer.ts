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
    });
  }

  private getMesh(): Primitive {
    switch (this.format) {
      case '360':
        return sphere({ radius: 1 });
      case '180': {
        return sphere({ radius: 1, halfSphere: true });
      }

      case 'screen':
      // falls through
      default:
        return square({ scale: 1 });
    }
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

  protected getAspectRation(video: HTMLVideoElement) {
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
}

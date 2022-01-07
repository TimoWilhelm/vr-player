import reglInit from 'regl';
import sphere from 'primitive-icosphere';
import type { Format } from '../format';
import type { Layout } from '../layout';
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
      attribute vec3 normal;
      uniform vec4 texCoordScaleOffset;
      uniform mat4 model;
      uniform mat4 view;
      uniform mat4 projection;

      varying vec2 uv;

      vec2 mapToScreen(vec2 position) {
        return (position * vec2(1, -1) / 2.0 + vec2(0.5, 0.5)) * texCoordScaleOffset.xy + texCoordScaleOffset.zw;
      }

      vec2 mapToHalfCircle(vec3 normal) {
        return vec2(0.5 + atan(normal.z, normal.x) / 6.28318531, 0.5 + asin(-normal.y) / 3.14159265) * vec2(2.0, 1.0) * texCoordScaleOffset.xy + texCoordScaleOffset.zw;
      }

      void main() {
        gl_Position = projection * view * model * vec4(position, 1);
        uv = ${
          this.format === '180'
            ? 'mapToHalfCircle(normal)'
            : 'mapToScreen(position.xy)'
        };
      }`,
      frag: `
      precision highp float;

      uniform sampler2D texture;

      varying vec2 uv;

      void main() {
          gl_FragColor = texture2D(texture, uv);
      }`,
      attributes: {
        position: mesh.positions,
        normal: mesh.normals,
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
      elements: mesh.cells,
    });
  }

  protected getMesh() {
    switch (this.format) {
      case '180': {
        const s = sphere(1, {
          subdivisions: 5,
        });
        return s;
      }

      case 'screen':
      // falls through
      default:
        return {
          positions: [
            [-1, 1, 0],
            [-1, -1, 0],
            [1, -1, 0],
            [1, 1, 0],
          ],
          cells: [
            [0, 2, 1],
            [0, 3, 2],
          ],
          normals: [
            [0, 0, 1],
            [0, 0, 1],
          ],
        };
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

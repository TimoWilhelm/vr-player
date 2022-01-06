import { VideoLoader } from '../loader/videoLoader';
import reglInit from 'regl';
import type { DisplayMode } from './displayMode';
import type { Regl } from 'regl';
import type { RenderProps } from './renderProps';

export abstract class Renderer {
  protected readonly regl: Regl;

  protected readonly cmdRender: reglInit.DrawCommand<
    reglInit.DefaultContext,
    RenderProps
  >;

  constructor(
    private readonly videoSrc: string,
    private readonly displayMode: DisplayMode,
  ) {
    this.regl = reglInit({ pixelRatio: 1 });

    this.cmdRender = this.regl({
      vert: `
      precision highp float;

      attribute vec3 position;
      uniform vec4 texCoordScaleOffset;
      uniform mat4 model, view, projection;

      varying vec2 uv;

      vec2 normalizeCoords(vec2 position) {
        return position * vec2(1, -1) / 2.0 + vec2(0.5, 0.5);
     }

      void main() {
        gl_Position = projection * view * model * vec4(position, 1);
        uv = normalizeCoords(position.xy) * texCoordScaleOffset.xy + texCoordScaleOffset.zw;
      }`,
      frag: `
      precision highp float;

      uniform sampler2D texture;

      varying vec2 uv;

      void main() {
        gl_FragColor = texture2D(texture, uv);
      }`,
      attributes: {
        position: [
          [-1, 1, 0],
          [-1, -1, 0],
          [1, -1, 0],
          [1, 1, 0],
        ],
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
      elements: [
        [0, 2, 1],
        [0, 3, 2],
      ],
    });
  }

  abstract start(): Promise<void>;

  protected getTexCoordScaleOffsets() {
    switch (this.displayMode) {
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
    switch (this.displayMode) {
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

  protected async loadVideo() {
    return VideoLoader.load(this.videoSrc);
  }
}

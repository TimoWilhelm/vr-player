import { Renderer, VideoFrameTracker } from './renderer';
import { mat4, vec4 } from 'gl-matrix';
import type { Format, Layout } from '../types';
import type { RenderProps } from './renderProps';
import type { Texture2DOptions } from 'regl';

export class DebugRenderer extends Renderer {
  private raf = 0;
  private frameTracker: VideoFrameTracker | null = null;

  constructor(
    private readonly video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    layout: Layout,
    flipLayout: boolean,
    format: Format,
    private readonly eye: 'left' | 'right',
  ) {
    super(canvas, layout, flipLayout, format);
  }

  protected stopDrawLoop(): void {
    window.cancelAnimationFrame(this.raf);
    this.frameTracker?.stop();
  }

  protected async startDrawLoop(): Promise<void> {
    const textureProps: Texture2DOptions = { data: this.video, flipY: true };
    const texture = this.regl.texture(textureProps);

    this.frameTracker = new VideoFrameTracker(this.video);
    const { frameTracker } = this;

    const inverseModel = this.getInverseModelMatrix(this.video);

    const view = mat4.lookAt(mat4.create(), [0, 0, 0], [0, 0, -1], [0, 1, 0]);

    const projection = mat4.perspective(
      mat4.create(),
      Math.PI / 2,
      this.canvas.width / this.canvas.height,
      0.01,
      100,
    );

    const vp = mat4.create();
    mat4.multiply(vp, projection, view);
    const ivp = mat4.create();
    mat4.invert(ivp, vp);
    // Precompute combined inverse: inverseModel * inverseViewProjection
    const imvp = mat4.create();
    mat4.multiply(imvp, inverseModel, ivp);

    // Precompute model-space eye (eye is at origin)
    const tempEye = vec4.fromValues(0, 0, 0, 1);
    vec4.transformMat4(tempEye, tempEye, inverseModel);
    const modelSpaceEye = new Float32Array(
      (tempEye as Float32Array).buffer,
      0,
      3,
    );

    const offsets = this.getTexCoordScaleOffsets();
    const offset = this.eye === 'left' ? offsets[0] : offsets[1];

    const drawLoop = () => {
      this.regl.clear({ color: [0, 0, 0, 1], depth: 1 });

      if (frameTracker.consumeFrame()) {
        texture.subimage(textureProps);
      }

      const props: RenderProps = {
        inverseModelViewProjection: imvp,
        modelSpaceEye,
        texture,
        viewport: {
          x: 0,
          y: 0,
          width: this.canvas.width,
          height: this.canvas.height,
        },
        texCoordScaleOffset: offset,
      };
      this.cmdRender(props);

      this.raf = window.requestAnimationFrame(drawLoop);
    };

    this.raf = window.requestAnimationFrame(drawLoop);

    return Promise.resolve();
  }
}

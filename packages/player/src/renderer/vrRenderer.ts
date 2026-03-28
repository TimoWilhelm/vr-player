/* eslint-disable no-underscore-dangle */
import { Renderer, VideoFrameTracker } from './renderer';
import { mat4, vec4 } from 'gl-matrix';
import type { Format, Layout } from '../types';
import type { RenderProps } from './renderProps';
import type { Texture2DOptions } from 'regl';

export class VrRenderer extends Renderer {
  private raf = 0;
  private frameTracker: VideoFrameTracker | null = null;

  constructor(
    private readonly xrSession: XRSession,
    private readonly video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    layout: Layout,
    flipLayout: boolean,
    format: Format,
  ) {
    super(canvas, layout, flipLayout, format);
  }

  protected stopDrawLoop(): void {
    this.xrSession.cancelAnimationFrame(this.raf);
    this.frameTracker?.stop();
  }

  protected async startDrawLoop(): Promise<void> {
    // **** First hack to get this to work with regl:
    await this.regl._gl.makeXRCompatible();
    await this.xrSession.updateRenderState({
      baseLayer: new XRWebGLLayer(this.xrSession, this.regl._gl),
      depthFar: this.xrSession.renderState.depthFar,
      depthNear: this.xrSession.renderState.depthNear,
    });

    const rates = this.xrSession.supportedFrameRates;
    if (rates && rates.length > 0) {
      const maxRate = Math.max(...Array.from(rates));
      await this.xrSession.updateTargetFrameRate(maxRate);
    }

    const textureProps: Texture2DOptions = { data: this.video, flipY: true };
    const texture = this.regl.texture(textureProps);
    this.frameTracker = new VideoFrameTracker(this.video);
    const { frameTracker } = this;

    const inverseModel = this.getInverseModelMatrix(this.video);

    const vp = mat4.create();
    const ivp = mat4.create();
    const imvp = mat4.create();
    const modelSpaceEye = new Float32Array(3);
    const tempEye = vec4.create();

    const offsets = this.getTexCoordScaleOffsets();
    const xrReferenceSpace =
      await this.xrSession.requestReferenceSpace('local');

    const drawLoop: XRFrameRequestCallback = (
      _time: DOMHighResTimeStamp,
      xrFrame: XRFrame,
    ) => {
      const glLayer = this.xrSession.renderState.baseLayer;
      const pose = xrFrame.getViewerPose(xrReferenceSpace);

      if (!glLayer || !pose) {
        this.raf = this.xrSession.requestAnimationFrame(drawLoop);
        return;
      }

      // **** Second hack to get this to work with regl. Bind the framebuffer and clear it before
      // **** rendering to it. Note that this is not a regl framebuffer, it's just a WebGL framebuffer
      // **** ID handed to us by WebXR.
      this.regl._gl.bindFramebuffer(
        this.regl._gl.FRAMEBUFFER,
        glLayer.framebuffer,
      );
      this.regl._gl.clearColor(0, 0, 0, 1);
      this.regl._gl.clear(
        // eslint-disable-next-line no-bitwise
        this.regl._gl.DEPTH_BUFFER_BIT | this.regl._gl.COLOR_BUFFER_BIT,
      );

      // Upload video texture only when a new decoded frame is available
      if (frameTracker.consumeFrame()) {
        texture.subimage(textureProps);
      }

      // Render each eye.
      pose.views.forEach((poseView) => {
        const { position } = poseView.transform;

        const viewport = glLayer.getViewport(poseView);

        if (viewport === undefined) {
          throw new Error('Viewport is undefined');
        }

        mat4.multiply(
          vp,
          poseView.projectionMatrix as mat4,
          poseView.transform.inverse.matrix,
        );
        mat4.invert(ivp, vp);
        // Combined inverse: inverseModel * inverseViewProjection
        mat4.multiply(imvp, inverseModel, ivp);

        // Model-space eye position: inverseModel * eyePosition
        vec4.set(tempEye, position.x, position.y, position.z, 1.0);
        vec4.transformMat4(tempEye, tempEye, inverseModel);
        modelSpaceEye[0] = tempEye[0];
        modelSpaceEye[1] = tempEye[1];
        modelSpaceEye[2] = tempEye[2];

        const props: RenderProps = {
          inverseModelViewProjection: imvp,
          modelSpaceEye,
          texture,
          viewport,
          texCoordScaleOffset:
            poseView.eye === 'left' ? offsets[0] : offsets[1],
        };
        this.cmdRender(props);
      });

      this.raf = this.xrSession.requestAnimationFrame(drawLoop);
    };

    this.raf = this.xrSession.requestAnimationFrame(drawLoop);
  }
}

/* eslint-disable no-underscore-dangle */
import { Renderer } from './renderer';
import { mat4, vec3 } from 'gl-matrix';
import type { Format } from '../format';
import type { Layout } from '../layout';
import type { RenderProps } from './renderProps';
import type { Texture2DOptions } from 'regl';
import type { XRFrame, XRFrameRequestCallback, XRSession } from 'webxr';

export class VrRenderer extends Renderer {
  private raf = 0;

  constructor(
    private readonly xrSession: XRSession,
    private readonly video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    layout: Layout,
    format: Format,
  ) {
    super(canvas, layout, format);
  }

  protected stopDrawLoop(): void {
    window.cancelAnimationFrame(this.raf);
  }

  protected async startDrawLoop(): Promise<void> {
    // **** First hack to get this to work with regl:
    // @ts-expect-error unstable API
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.regl._gl.makeXRCompatible();
    await this.xrSession.updateRenderState({
      // @ts-expect-error unstable API
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      baseLayer: new XRWebGLLayer(this.xrSession, this.regl._gl),
      depthFar: this.xrSession.renderState.depthFar,
      depthNear: this.xrSession.renderState.depthNear,
    });

    const textureProps: Texture2DOptions = { data: this.video, flipY: true };
    const texture = this.regl.texture(textureProps);

    const model = this.getModelMatrix(this.video);

    const view = mat4.create();

    const offsets = this.getTexCoordScaleOffsets();
    const xrReferenceSpace = await this.xrSession.requestReferenceSpace(
      'local',
    );

    const drawLoop: XRFrameRequestCallback = (
      _time: DOMHighResTimeStamp,
      xrFrame: XRFrame,
    ) => {
      const glLayer = this.xrSession.renderState.baseLayer;
      const pose = xrFrame.getViewerPose(xrReferenceSpace);

      if (!glLayer || !pose) {
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

      // Render each eye.
      pose.views.forEach((poseView) => {
        const { position } = poseView.transform;

        const props: RenderProps = {
          model,
          view: mat4.translate(
            view,
            poseView.transform.inverse.matrix,
            vec3.fromValues(position.x, position.y, position.z),
          ),
          projection: poseView.projectionMatrix,
          texture: texture.subimage(textureProps),
          viewport: glLayer.getViewport(poseView),
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

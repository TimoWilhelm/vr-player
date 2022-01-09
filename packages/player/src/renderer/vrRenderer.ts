/* eslint-disable no-underscore-dangle */
import { Renderer } from './renderer';
import { mat4, vec3 } from 'gl-matrix';
import type { Format } from '../format';
import type { Layout } from '../layout';
import type { RenderProps } from './renderProps';
import type { Texture2DOptions } from 'regl';
import type { XRFrame, XRFrameRequestCallback, XRSession } from 'webxr';

export class VrRenderer extends Renderer {
  constructor(
    private readonly xrSession: XRSession,
    private readonly video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    layout: Layout,
    format: Format,
  ) {
    super(canvas, layout, format);
  }

  async start(): Promise<void> {
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
    const aspectRatio = this.getAspectRation(this.video);

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

    const offsets = this.getTexCoordScaleOffsets();
    const xrReferenceSpace = await this.xrSession.requestReferenceSpace(
      'local',
    );

    const drawLoop: XRFrameRequestCallback = (
      _timestamp: number,
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
            mat4.create(),
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

      this.xrSession.requestAnimationFrame(drawLoop);
    };

    this.xrSession.requestAnimationFrame(drawLoop);
  }
}

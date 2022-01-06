/* eslint-disable no-underscore-dangle */

import { mat4 } from 'gl-matrix';
import reglInit from 'regl';
import type {
  XRFrame,
  XRFrameRequestCallback,
  XRSession,
  XRViewport,
} from 'webxr';

import { elements, normals, positions } from './bunny';

type RenderProps = {
  model: mat4;
  view: Float32Array;
  projection: Float32Array;
  viewport: XRViewport;
};

export const debug = async (xrSession: XRSession) => {
  const xrReferenceSpace = await xrSession.requestReferenceSpace('local');

  const regl = reglInit({ pixelRatio: 1 });

  // **** First hack to get this to work with regl:
  // @ts-expect-error unstable API
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  await regl._gl.makeXRCompatible();

  await xrSession.updateRenderState({
    // @ts-expect-error unstable API
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    baseLayer: new XRWebGLLayer(xrSession, regl._gl),
    depthFar: xrSession.renderState.depthFar,
    depthNear: xrSession.renderState.depthNear,
  });

  const cmdRender = regl({
    vert: `
      precision highp float;
      attribute vec3 position, normal;
      uniform mat4 model, view, projection;
      varying vec3 vNormal;
      void main() {
        gl_Position = projection * view * model * vec4(position, 1);
        vNormal = normal;
      }`,
    frag: `
      precision highp float;
      varying vec3 vNormal;
      void main() {
        gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1);
      }`,
    attributes: {
      position: positions,
      normal: normals,
    },
    // TODO: https://github.com/regl-project/regl/pull/632
    uniforms: {
      model: regl.prop<RenderProps, 'model'>('model'),
      view: regl.prop<RenderProps, 'view'>('view'),
      projection: regl.prop<RenderProps, 'projection'>('projection'),
    },
    viewport: regl.prop<RenderProps, 'viewport'>('viewport'),
    elements,
  });

  const drawLoop: XRFrameRequestCallback = (
    timestamp: number,
    xrFrame: XRFrame,
  ) => {
    // Create and animate the model matrix.
    const model = mat4.create();
    mat4.translate(model, model, [0, 0, -0.5]);
    mat4.rotateY(model, model, timestamp * 0.001);
    mat4.rotateX(model, model, timestamp * 0.0013);
    mat4.scale(model, model, [0.01, 0.01, 0.01]);

    const glLayer = xrSession.renderState.baseLayer;
    const pose = xrFrame.getViewerPose(xrReferenceSpace);

    if (!glLayer || !pose) {
      return;
    }

    // **** Second hack to get this to work with regl. Bind the framebuffer and clear it before
    // **** rendering to it. Note that this is not a regl framebuffer, it's just a WebGL framebuffer
    // **** ID handed to us by WebXR.
    regl._gl.bindFramebuffer(regl._gl.FRAMEBUFFER, glLayer.framebuffer);
    regl._gl.clearColor(1, 1, 1, 1);
    // eslint-disable-next-line no-bitwise
    regl._gl.clear(regl._gl.DEPTH_BUFFER_BIT | regl._gl.COLOR_BUFFER_BIT);

    // Render each eye.
    pose.views.forEach((poseView) => {
      const props: RenderProps = {
        model,
        view: poseView.transform.inverse.matrix,
        projection: poseView.projectionMatrix,
        viewport: glLayer.getViewport(poseView),
      };
      cmdRender(props);
    });

    xrSession.requestAnimationFrame(drawLoop);
  };

  xrSession.requestAnimationFrame(drawLoop);
};

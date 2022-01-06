/* eslint-disable no-underscore-dangle */

import { mat4 } from 'gl-matrix';
import reglInit from 'regl';
import type { Texture2D } from 'regl';
import type {
  XRFrame,
  XRFrameRequestCallback,
  XRSession,
  XRViewport,
} from 'webxr';

type DisplayMode = 'mono' | 'stereoTopBottom' | 'stereoLeftRight';

const getTexCoordScaleOffsets = (displayMode: DisplayMode) => {
  switch (displayMode) {
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
};

type RenderProps = {
  model: mat4;
  view: Float32Array;
  projection: Float32Array;
  texture: Texture2D;
  texCoordScaleOffset: Float32Array;
  viewport: XRViewport;
};

export const debug2 = async (
  xrSession: XRSession,
  video: HTMLVideoElement,
  displayMode: DisplayMode = 'mono',
) => {
  const offsets = getTexCoordScaleOffsets(displayMode);

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

  await video.play();

  const texture = regl.texture(video);

  const cmdRender = regl({
    vert: `
      precision highp float;

      attribute vec3 position;
      attribute vec2 texCoord0;
      varying vec2 vTexCoord;
      uniform vec4 texCoordScaleOffset;
      uniform mat4 model, view, projection;
      void main() {
        gl_Position = projection * view * model * vec4(position, 1);
        vTexCoord = (texCoord0 * texCoordScaleOffset.xy) + texCoordScaleOffset.zw;
      }`,
    frag: `
      precision highp float;

      uniform sampler2D texture;
      varying vec2 vTexCoord;
      void main() {
        gl_FragColor = texture2D(texture, vTexCoord);
      }`,
    attributes: {
      position: [
        [-1.0, 1.0, 0.0, 0.0, 0.0],
        [1.0, 1.0, 0.0, 1.0, 0.0],
        [1.0, -1.0, 0.0, 1.0, 1.0],
        [-1.0, -1.0, 0.0, 0.0, 1.0],
      ],
      texCoord0: [0.0, 1.0],
    },
    // TODO: https://github.com/regl-project/regl/pull/632
    uniforms: {
      model: regl.prop<RenderProps, 'model'>('model'),
      view: regl.prop<RenderProps, 'view'>('view'),
      projection: regl.prop<RenderProps, 'projection'>('projection'),
      texture: regl.prop<RenderProps, 'texture'>('texture'),
      texCoordScaleOffset: regl.prop<RenderProps, 'texCoordScaleOffset'>(
        'texCoordScaleOffset',
      ),
    },
    viewport: regl.prop<RenderProps, 'viewport'>('viewport'),
    elements: [
      [0, 2, 1],
      [0, 3, 2],
    ],
  });

  const drawLoop: XRFrameRequestCallback = (
    timestamp: number,
    xrFrame: XRFrame,
  ) => {
    const model = mat4.create();

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
        texture,
        viewport: glLayer.getViewport(poseView),
        texCoordScaleOffset: poseView.eye === 'left' ? offsets[0] : offsets[1],
      };
      cmdRender(props);
    });

    xrSession.requestAnimationFrame(drawLoop);
  };

  xrSession.requestAnimationFrame(drawLoop);
};

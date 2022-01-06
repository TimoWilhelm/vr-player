/* eslint-disable no-underscore-dangle */

import { mat4 } from 'gl-matrix';
import reglInit from 'regl';
import type { Texture2D } from 'regl';

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

const getAspectRation = (video: HTMLVideoElement, displayMode: DisplayMode) => {
  switch (displayMode) {
    case 'stereoTopBottom':
      return (video.videoWidth / video.videoHeight) * 0.5;
    case 'stereoLeftRight':
      return (video.videoWidth * 0.5) / video.videoHeight;
    case 'mono':
    // falls through
    default:
      return video.videoWidth / video.videoHeight;
  }
};

type RenderProps = {
  model: mat4;
  view: Float32Array;
  projection: Float32Array;
  texture: Texture2D;
  texCoordScaleOffset: Float32Array;
  viewport: {
    x: GLint;
    y: GLint;
    width: GLsizei;
    height: GLsizei;
  };
};

export const debug3 = async (
  videoSrc: string,
  displayMode: DisplayMode = 'mono',
) => {
  const offsets = getTexCoordScaleOffsets(displayMode);

  const regl = reglInit({ pixelRatio: 1 });

  const { canvas } = regl._gl;

  const video = document.createElement('video');
  video.src = videoSrc;
  video.loop = true;
  const videoLoaded = new Promise((resolve) => {
    video.onloadeddata = resolve;
  });
  void video.play();
  await videoLoaded;
  const texture = regl.texture(video);

  const aspectRatio = getAspectRation(video, displayMode);

  const cmdRender = regl({
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

  const model = mat4.create();
  mat4.translate(model, model, [0, 0, 2000]);
  // scale according to aspect ratio
  mat4.scale(model, model, [
    video.videoWidth * aspectRatio,
    video.videoHeight,
    1,
  ]);
  // mat4.scale(model, model, [aspectRatio, 1, 1]);

  const view = mat4.lookAt(mat4.create(), [0, 0, 0], [0, 0, 1], [0, 1, 0]);

  const projection = mat4.perspective(
    mat4.create(),
    Math.PI / 2,
    canvas.width / canvas.height,
    0.01,
    Infinity,
  );

  const drawLoop = () => {
    regl.clear({ color: [1, 1, 1, 1], depth: 1 });
    cmdRender({
      model,
      view,
      projection,
      texture: texture.subimage(video),
      viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height },
      texCoordScaleOffset: offsets[0],
    });

    window.requestAnimationFrame(drawLoop);
  };

  window.requestAnimationFrame(drawLoop);
};

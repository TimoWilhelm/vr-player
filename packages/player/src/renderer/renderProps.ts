import type { Texture2D } from 'regl';
import type { mat4 } from 'gl-matrix';

export type RenderProps = {
  model: mat4;
  view: mat4 | Float32Array;
  projection: mat4 | Float32Array;
  texture: Texture2D;
  texCoordScaleOffset: Float32Array;
  viewport: {
    x: GLint;
    y: GLint;
    width: GLsizei;
    height: GLsizei;
  };
};

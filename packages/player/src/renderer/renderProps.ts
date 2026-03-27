import type { Texture2D } from 'regl';
import type { mat4 } from 'gl-matrix';

export type RenderProps = {
  inverseViewProjection: mat4 | Float32Array;
  inverseModel: mat4;
  eyePosition: Float32Array;
  format: number;
  texture: Texture2D;
  texCoordScaleOffset: Float32Array;
  viewport: { x: GLint; y: GLint; width: GLsizei; height: GLsizei };
};

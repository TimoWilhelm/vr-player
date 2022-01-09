import { vec3 } from 'gl-matrix';
import type { Primitive } from './primitive';

export function square({ scale = 1 }): Primitive {
  return {
    positions: [
      vec3.scale(vec3.create(), [-1, 1, 0], scale),
      vec3.scale(vec3.create(), [-1, -1, 0], scale),
      vec3.scale(vec3.create(), [1, -1, 0], scale),
      vec3.scale(vec3.create(), [1, 1, 0], scale),
    ],
    indices: [
      [0, 2, 1],
      [0, 3, 2],
    ],
    uvs: [
      [1, 1],
      [1, 0],
      [0, 0],
      [0, 1],
    ],
    normals: [
      [0, 0, -1],
      [0, 0, -1],
    ],
  };
}

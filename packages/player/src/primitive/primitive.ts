import type { vec2, vec3 } from 'gl-matrix';

export type Primitive = {
  positions: vec3[];
  indices: vec3[];
  uvs: vec2[];
  normals: vec3[];
};

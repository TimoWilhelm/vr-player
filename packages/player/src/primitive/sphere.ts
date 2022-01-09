import { mat4, vec2, vec3 } from 'gl-matrix';
import type { Primitive } from './primitive';

const up = vec3.fromValues(0, 1, 0);

export function sphere({
  radius = 1,
  segments = 32,
  halfSphere = false,
}): Primitive {
  const indices = [] as vec3[];
  const positions = [] as vec3[];
  const normals = [] as vec3[];
  const uvs = [] as vec2[];

  const tmpVec3 = vec3.create();
  const tmpMatRotZ = mat4.create();
  const tmpMatRotY = mat4.create();

  const totalZRotationSteps = 2 + segments;
  const totalYRotationSteps = 2 * totalZRotationSteps;

  for (
    let zRotationStep = 0;
    zRotationStep <= totalZRotationSteps;
    zRotationStep += 1
  ) {
    const normalizedZ = zRotationStep / totalZRotationSteps;
    const angleZ = normalizedZ * Math.PI;

    for (
      let yRotationStep = 0;
      yRotationStep <= totalYRotationSteps;
      yRotationStep += 1
    ) {
      const normalizedY = yRotationStep / totalYRotationSteps;
      const angleY = normalizedY * Math.PI * 2;

      mat4.identity(tmpMatRotZ);
      mat4.rotateZ(tmpMatRotZ, tmpMatRotZ, -angleZ);

      mat4.identity(tmpMatRotY);
      mat4.rotateY(tmpMatRotY, tmpMatRotY, halfSphere ? angleY / 2 : angleY);

      vec3.transformMat4(tmpVec3, up, tmpMatRotZ);
      vec3.transformMat4(tmpVec3, tmpVec3, tmpMatRotY);

      vec3.scale(tmpVec3, tmpVec3, -radius);
      positions.push(vec3.clone(tmpVec3));

      vec3.normalize(tmpVec3, tmpVec3);
      normals.push(vec3.clone(tmpVec3));

      uvs.push(vec2.fromValues(1 - normalizedY, normalizedZ));
    }

    if (zRotationStep > 0) {
      const verticesCount = positions.length;

      for (
        let firstIndex = verticesCount - 2 * (totalYRotationSteps + 1);
        firstIndex + totalYRotationSteps + 2 < verticesCount;
        firstIndex += 1
      ) {
        indices.push(
          vec3.fromValues(
            firstIndex,
            firstIndex + 1,
            firstIndex + totalYRotationSteps + 1,
          ),
        );
        indices.push(
          vec3.fromValues(
            firstIndex + totalYRotationSteps + 1,
            firstIndex + 1,
            firstIndex + totalYRotationSteps + 2,
          ),
        );
      }
    }
  }

  return {
    indices,
    positions,
    normals,
    uvs,
  };
}

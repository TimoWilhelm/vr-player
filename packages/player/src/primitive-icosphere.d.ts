declare module 'primitive-icosphere' {
  declare function Sphere(
    radius: number,
    opts?: { subdivisions?: number },
  ): SphereMesh;

  export = Sphere;

  declare type SphereMesh = {
    positions: [];
    cells: [];
    uvs: [];
    normals: [];
  };
}

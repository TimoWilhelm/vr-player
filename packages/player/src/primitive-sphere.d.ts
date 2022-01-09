declare module 'primitive-sphere' {
  declare function Sphere(
    radius: number,
    opts?: { segments?: number },
  ): {
    positions: [];
    cells: [];
    uvs: [];
    normals: [];
  };

  export = Sphere;
}

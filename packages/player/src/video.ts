import reglInit from 'regl';

type Props = {
  texCoordScaleOffset: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
};

type DisplayMode = 'mono' | 'stereoTopBottom' | 'stereoLeftRight';

const getTexCoordScaleOffset = (displayMode: DisplayMode) => {
  switch (displayMode) {
    case 'stereoTopBottom':
      return [1.0, 0.5, 0.0, 0.0, 1.0, 0.5, 0.0, 0.5];
    case 'stereoLeftRight':
      return [0.5, 1.0, 0.0, 0.0, 0.5, 1.0, 0.5, 0.0];
    case 'mono':
    // falls through
    default:
      return [1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0];
  }
};

export const debug = (displayMode: DisplayMode) => {
  const regl = reglInit({ pixelRatio: 1 });

  const render = regl({
    frag: `
    precision highp float;

    uniform sampler2D diffuse;
    varying vec2 vTexCoord;
    void fragment_main() {
      gl_FragColor = texture2D(diffuse, vTexCoord);
    }
  `,
    vert: `
    uniform int EYE_INDEX;
    uniform vec4 texCoordScaleOffset[2];
    attribute vec3 POSITION;
    attribute vec2 TEXCOORD_0;
    varying vec2 vTexCoord;
    void main(mat4 proj, mat4 view, mat4 model) {
      vec4 scaleOffset = texCoordScaleOffset[EYE_INDEX];
      vTexCoord = (TEXCOORD_0 * scaleOffset.xy) + scaleOffset.zw;
      vec4 out_vec = proj * view * model * vec4(POSITION, 1.0);
      gl_Position = out_vec;
    }
  `,
    attributes: {
      POSITION: regl.buffer([
        [-1.0, 1.0, 0.0, 0.0, 0.0],
        [1.0, 1.0, 0.0, 1.0, 0.0],
        [1.0, -1.0, 0.0, 1.0, 1.0],
        [-1.0, -1.0, 0.0, 0.0, 1.0],
      ]),
    },
    uniforms: {
      // This defines the color of the triangle to be a dynamic variable
      texCoordScaleOffset: regl.prop<Props, 'texCoordScaleOffset'>(
        'texCoordScaleOffset',
      ),
    },
    count: 3,
  });

  regl.frame(() => {
    regl.clear({
      color: [0, 0, 0, 0],
      depth: 1,
    });

    render({
      texCoordScaleOffset: getTexCoordScaleOffset(displayMode),
    });
  });
};

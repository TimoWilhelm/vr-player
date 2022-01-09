/* eslint-disable no-underscore-dangle */
import { Renderer } from './renderer';
import { mat4 } from 'gl-matrix';
import type { Format } from '../format';
import type { Layout } from '../layout';
import type { RenderProps } from './renderProps';
import type { Texture2DOptions } from 'regl';

export class DebugRenderer extends Renderer {
  constructor(
    private readonly video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    layout: Layout,
    format: Format,
    private readonly view: 'left' | 'right',
  ) {
    super(canvas, layout, format);
  }

  start(): Promise<void> {
    const textureProps: Texture2DOptions = { data: this.video, flipY: true };
    const texture = this.regl.texture(textureProps);
    const aspectRatio = this.getAspectRation(this.video);

    const model = mat4.create();
    // rotate model 180 deg to flip z axis as WebXR looks towards -z
    // https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Geometry
    mat4.rotateY(model, model, Math.PI);

    if (this.format === 'screen') {
      const screenHeight = 1;

      // scale according to aspect ratio
      mat4.scale(model, model, [screenHeight * aspectRatio, screenHeight, 1]);
      // move screen back a bit
      mat4.translate(model, model, [0, 0, screenHeight]);
    }

    if (this.format === '360') {
      // rotate model 90 deg to look at the center of the video
      mat4.rotateY(model, model, -Math.PI / 2);
    }

    const view = mat4.lookAt(mat4.create(), [0, 0, 0], [0, 0, -1], [0, 1, 0]);

    const projection = mat4.perspective(
      mat4.create(),
      Math.PI / 2,
      this.canvas.width / this.canvas.height,
      0.01,
      Infinity,
    );

    const offsets = this.getTexCoordScaleOffsets();
    const offset = this.view === 'left' ? offsets[0] : offsets[1];

    const drawLoop = () => {
      this.regl.clear({ color: [0, 0, 0, 1], depth: 1 });

      const props: RenderProps = {
        model,
        view,
        projection,
        texture: texture.subimage(textureProps),
        viewport: {
          x: 0,
          y: 0,
          width: this.canvas.width,
          height: this.canvas.height,
        },
        texCoordScaleOffset: offset,
      };
      this.cmdRender(props);

      window.requestAnimationFrame(drawLoop);
    };

    window.requestAnimationFrame(drawLoop);

    return Promise.resolve();
  }
}

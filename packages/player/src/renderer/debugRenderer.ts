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
    private readonly view: 'left' | 'right' = 'left',
  ) {
    super(canvas, layout, format);
  }

  start(): Promise<void> {
    const { canvas } = this.regl._gl;

    const textureProps: Texture2DOptions = { data: this.video };
    const texture = this.regl.texture(textureProps);
    const aspectRatio = this.getAspectRation(this.video);

    const screenHeight = 1;

    const model = mat4.create();

    mat4.translate(model, model, [0, 0, -screenHeight]);
    // scale according to aspect ratio
    mat4.scale(model, model, [screenHeight * aspectRatio, screenHeight, 1]);

    const view = mat4.lookAt(mat4.create(), [0, 0, 0], [0, 0, -1], [0, 1, 0]);

    const projection = mat4.perspective(
      mat4.create(),
      Math.PI / 2,
      canvas.width / canvas.height,
      0.01,
      Infinity,
    );

    const offsets = this.getTexCoordScaleOffsets();
    const offset = this.view === 'left' ? offsets[0] : offsets[1];

    const drawLoop = () => {
      this.regl.clear({ color: [1, 1, 1, 1], depth: 1 });

      const props: RenderProps = {
        model,
        view,
        projection,
        texture: texture.subimage(textureProps),
        viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height },
        texCoordScaleOffset: offset,
      };
      this.cmdRender(props);

      window.requestAnimationFrame(drawLoop);
    };

    window.requestAnimationFrame(drawLoop);

    return Promise.resolve();
  }
}

/* eslint-disable no-underscore-dangle */
import { Renderer } from './renderer';
import { mat4 } from 'gl-matrix';
import type { DisplayMode } from './displayMode';
import type { RenderProps } from './renderProps';

export class DebugRenderer extends Renderer {
  constructor(
    videoSrc: string,
    displayMode: DisplayMode,
    private readonly view: 'left' | 'right' = 'left',
  ) {
    super(videoSrc, displayMode);
  }

  async start(): Promise<void> {
    const { canvas } = this.regl._gl;

    const video = await this.loadVideo();
    const texture = this.regl.texture(video);
    const aspectRatio = this.getAspectRation(video);

    const screenHeight = 300;

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
        texture: texture.subimage(video),
        viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height },
        texCoordScaleOffset: offset,
      };
      this.cmdRender(props);

      window.requestAnimationFrame(drawLoop);
    };

    window.requestAnimationFrame(drawLoop);
  }
}

import { DebugRenderer } from './renderer/debugRenderer';
import type { Format } from './format';
import type { Layout } from './layout';

export const debug = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  layout: Layout,
  format: Format,
) => {
  const renderer = new DebugRenderer(video, canvas, layout, format);
  void renderer.start();
};

import { DebugRenderer } from './renderer/debugRenderer';
import type { Format } from './format';
import type { Layout } from './layout';

export const debug = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  layout: Layout,
  format: Format,
  view: 'left' | 'right',
) => {
  const renderer = new DebugRenderer(video, canvas, layout, format, view);
  await renderer.start();
};

import { DebugRenderer } from './renderer/debugRenderer';
import type { Format } from './renderer/format';
import type { Layout } from './renderer/layout';

export const debug = (videoSrc: string, layout: Layout, format: Format) => {
  const renderer = new DebugRenderer(videoSrc, layout, format);
  void renderer.start();
};

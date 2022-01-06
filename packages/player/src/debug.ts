import { DebugRenderer } from './renderer/debugRenderer';
import type { DisplayMode } from './renderer/displayMode';

export const debug = (videoSrc: string, displayMode: DisplayMode) => {
  const renderer = new DebugRenderer(videoSrc, displayMode);
  void renderer.start();
};

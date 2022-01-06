import { VrRenderer } from './renderer/vrRenderer';
import type { DisplayMode } from './renderer/displayMode';
import type { XRSession } from 'webxr';

export const play = (
  xrSession: XRSession,
  videoSrc: string,
  displayMode: DisplayMode,
) => {
  const renderer = new VrRenderer(xrSession, videoSrc, displayMode);
  void renderer.start();
};

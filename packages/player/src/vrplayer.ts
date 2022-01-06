import { VrRenderer } from './renderer/vrRenderer';
import type { Format } from './renderer/format';
import type { Layout } from './renderer/layout';
import type { XRSession } from 'webxr';

export const play = (
  xrSession: XRSession,
  videoSrc: string,
  layout: Layout,
  format: Format,
) => {
  const renderer = new VrRenderer(xrSession, videoSrc, layout, format);
  void renderer.start();
};

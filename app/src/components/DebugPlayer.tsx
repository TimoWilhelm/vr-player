/* eslint-disable no-param-reassign */
import { DebugRenderer } from '@vr-viewer/player';
import { useEffect } from 'react';
import type { Format, Layout } from '@vr-viewer/player';

export function DebugPlayer({
  video,
  canvas,
  layout,
  format,
  view = 'left',
}: {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  layout: Layout;
  format: Format;
  view?: 'left' | 'right';
}) {
  useEffect(() => {
    const renderer = new DebugRenderer(video, canvas, layout, format, view);
    void renderer.start();
    return () => renderer.stop();
  }, [canvas, format, layout, video, view]);

  return null;
}

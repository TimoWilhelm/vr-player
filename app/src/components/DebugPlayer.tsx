/* eslint-disable no-param-reassign */
import { debug } from '@vr-viewer/player';
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
    void debug(video, canvas, layout, format, view);
  }, [canvas, format, layout, video, view]);

  return null;
}

/* eslint-disable no-param-reassign */
import { debug } from '@vr-viewer/player';
import { useEffect } from 'react';
import type { Format, Layout } from '@vr-viewer/player';

export function DebugPlayer({
  video,
  canvas,
  layout,
  format,
}: {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  layout: Layout;
  format: Format;
}) {
  useEffect(() => {
    debug(video, canvas, layout, format);
  }, [canvas, format, layout, video]);

  return <div />;
}

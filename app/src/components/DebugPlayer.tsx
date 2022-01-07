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
    document.body.appendChild(canvas);
    canvas.style.position = 'absolute';
    canvas.style.top = '0px';
    canvas.style.right = '0px';
    canvas.style.height = '300px';

    return () => {
      document.body.removeChild(canvas);
    };
  }, [canvas, format, layout, video]);

  return <div />;
}

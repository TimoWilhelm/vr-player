/* eslint-disable no-param-reassign */
import { DebugRenderer } from '@vr-viewer/player';
import { useEffect } from 'react';
import type { Format, Layout } from '@vr-viewer/player';

export function DebugPlayer({
  video,
  canvas,
  layout,
  flipLayout,
  format,
  view = 'left',
}: {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  layout: Layout;
  flipLayout: boolean;
  format: Format;
  view?: 'left' | 'right';
}) {
  useEffect(() => {
    const renderer = new DebugRenderer(
      video,
      canvas,
      layout,
      flipLayout,
      format,
      view,
    );
    void renderer.start();
    return () => {
      renderer.stop();
    };
  }, [canvas, flipLayout, format, layout, video, view]);

  return null;
}

import { VrRenderer } from '@vr-viewer/player';
import { useEffect } from 'react';
import type { Format, Layout } from '@vr-viewer/player';

export function VrPlayer({
  xrSession,
  video,
  canvas,
  layout,
  flipLayout,
  format,
}: {
  xrSession: XRSession;
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  layout: Layout;
  flipLayout: boolean;
  format: Format;
}) {
  useEffect(() => {
    const renderer = new VrRenderer(
      xrSession,
      video,
      canvas,
      layout,
      flipLayout,
      format,
    );
    void renderer.start();
    return () => {
      renderer.stop();
    };
  }, [canvas, flipLayout, format, layout, video, xrSession]);

  return null;
}

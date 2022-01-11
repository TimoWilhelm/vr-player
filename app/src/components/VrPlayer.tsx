import { VrRenderer } from '@vr-viewer/player';
import { useEffect } from 'react';
import type { Format, Layout } from '@vr-viewer/player';
import type { XRSession } from 'webxr';

export function VrPlayer({
  xrSession,
  video,
  canvas,
  layout,
  format,
}: {
  xrSession: XRSession;
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  layout: Layout;
  format: Format;
}) {
  useEffect(() => {
    const renderer = new VrRenderer(xrSession, video, canvas, layout, format);
    void renderer.start();
    return () => {
      renderer.stop();
    };
  }, [canvas, format, layout, video, xrSession]);

  return null;
}

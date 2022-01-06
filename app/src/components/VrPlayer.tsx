import { debug2 } from '@vr-viewer/player';
import { useEffect, useMemo, useState } from 'react';
import type { Navigator, XRSession } from 'webxr';

function checkForXRSupport() {
  return (
    (navigator as unknown as Navigator).xr?.isSessionSupported(
      'immersive-vr',
    ) ?? false
  );
}

export function VrPlayer() {
  const videoElement = useMemo(() => {
    const element = document.createElement('video');
    element.loop = true;
    element.src = '/video/sample.mp4';

    return element;
  }, []);

  const [xrSupported, setXrSupported] = useState<boolean | undefined>(
    undefined,
  );
  const [xrSession, setXrSession] = useState<XRSession | undefined>(undefined);

  useEffect(() => {
    const onDevicechange = () => {
      void checkForXRSupport().then(setXrSupported);
    };

    const xrNav = navigator as unknown as Navigator;

    xrNav.xr?.addEventListener('devicechange', onDevicechange);

    onDevicechange();

    return xrNav.xr?.removeEventListener('devicechange', onDevicechange);
  }, []);

  useEffect(() => {
    const onXrSessionEnd = () => {
      setXrSession(undefined);
    };

    const xrNav = navigator as unknown as Navigator;

    if (xrSession) {
      xrNav.xr?.addEventListener('end', onXrSessionEnd);

      void debug2(xrSession, videoElement, 'stereoLeftRight');
    }

    return xrNav.xr?.removeEventListener('end', onXrSessionEnd);
  }, [xrSession, videoElement]);

  const requestXrSession = async () => {
    if (xrSupported && !xrSession) {
      const session = await (
        navigator as unknown as Navigator
      ).xr.requestSession('immersive-vr');
      setXrSession(session);
    }
  };

  if (xrSupported === undefined) {
    return <span>Loading...</span>;
  }

  return (
    <div>
      {!xrSession && (
        <button
          type="button"
          disabled={!xrSupported}
          onClick={() => {
            void requestXrSession();
          }}
        >
          {xrSupported ? 'Request XR Session' : 'XR not supported'}
        </button>
      )}
    </div>
  );
}

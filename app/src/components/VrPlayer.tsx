import { play } from '@vr-viewer/player';
import { useEffect, useState } from 'react';
import type { XRSession } from 'webxr';

function checkForXRSupport() {
  if (!navigator.xr) {
    return Promise.resolve(false);
  }
  return navigator.xr.isSessionSupported('immersive-vr');
}

export function VrPlayer() {
  const [xrSupported, setXrSupported] = useState<boolean | undefined>(
    undefined,
  );
  const [xrSession, setXrSession] = useState<XRSession | undefined>(undefined);

  useEffect(() => {
    const onDevicechange = () => {
      void checkForXRSupport().then(setXrSupported);
    };

    navigator.xr?.addEventListener('devicechange', onDevicechange);

    onDevicechange();

    return navigator.xr?.removeEventListener('devicechange', onDevicechange);
  }, []);

  useEffect(() => {
    const onXrSessionEnd = () => {
      setXrSession(undefined);
    };

    if (xrSession) {
      navigator.xr?.addEventListener('end', onXrSessionEnd);

      play(xrSession, '/video/sample.mp4', 'stereoLeftRight', '180');
    }

    return navigator.xr?.removeEventListener('end', onXrSessionEnd);
  }, [xrSession]);

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

import { useCallback, useEffect, useState } from 'react';
import type { XRSession } from 'webxr';

function checkForXRSupport() {
  if (!navigator.xr) {
    return Promise.resolve(false);
  }
  return navigator.xr.isSessionSupported('immersive-vr');
}

export const useXRSession = () => {
  const [xrSupported, setXrSupported] = useState<boolean>(false);
  const [xrSession, setXrSession] = useState<XRSession | undefined>(undefined);

  useEffect(() => {
    const onDevicechange = () => {
      void checkForXRSupport().then(setXrSupported);
    };

    navigator.xr.addEventListener('devicechange', onDevicechange);

    onDevicechange();

    return () => {
      navigator.xr.removeEventListener('devicechange', onDevicechange);
    };
  }, []);

  useEffect(() => {
    const onXrSessionEnd = () => {
      setXrSession(undefined);
    };

    if (xrSession) {
      xrSession.addEventListener('end', onXrSessionEnd);
    }

    return () => {
      xrSession?.removeEventListener('end', onXrSessionEnd);
    };
  }, [xrSession]);

  const requestXrSession = useCallback(() => {
    if (xrSupported && !xrSession) {
      void navigator.xr.requestSession('immersive-vr').then((session) => {
        setXrSession(session);
      });
    }
  }, [xrSession, xrSupported]);

  return [xrSupported, requestXrSession, xrSession] as [
    boolean,
    () => void,
    XRSession | undefined,
  ];
};

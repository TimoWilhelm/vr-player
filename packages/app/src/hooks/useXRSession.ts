import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

const xrSupportedAtom = atom(false);
const xrSessionAtom = atom<XRSession | null>(null);

function checkForXRSupport() {
  if (!navigator.xr) {
    return Promise.resolve(false);
  }
  return navigator.xr.isSessionSupported('immersive-vr');
}

export const useXRSession = () => {
  const [xrSupported, setXrSupported] = useAtom(xrSupportedAtom);
  const [xrSession, setXrSession] = useAtom(xrSessionAtom);

  useEffect(() => {
    const onDevicechange = () => {
      void checkForXRSupport().then(setXrSupported);
    };

    navigator.xr?.addEventListener('devicechange', onDevicechange);

    onDevicechange();

    return () => {
      navigator.xr?.removeEventListener('devicechange', onDevicechange);
    };
  }, [setXrSupported]);

  useEffect(() => {
    const onXrSessionEnd = () => {
      setXrSession(null);
    };

    if (xrSession) {
      xrSession.addEventListener('end', onXrSessionEnd);
    }

    return () => {
      xrSession?.removeEventListener('end', onXrSessionEnd);
    };
  }, [setXrSession, xrSession]);

  const requestXrSession = useCallback(() => {
    if (xrSupported && !xrSession) {
      const domOverlayElement = document.getElementById('dom-overlay');

      void navigator.xr
        ?.requestSession('immersive-vr', {
          optionalFeatures: ['dom-overlay'],
          domOverlay: domOverlayElement
            ? {
                root: domOverlayElement,
              }
            : undefined,
        })
        .then((session) => {
          setXrSession(session);
        });
    }
  }, [setXrSession, xrSession, xrSupported]);

  return [xrSupported, xrSession, requestXrSession] as const;
};

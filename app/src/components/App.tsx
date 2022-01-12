import { BugNotification } from './BugNotification';
import { Control } from './Control';
import { DebugPlayer } from 'components/DebugPlayer';
import { GroupControl } from './GroupControl';
import { GroupControlElement } from './GroupControlElement';
import { VrPlayer } from 'components/VrPlayer';
import { recognizeVideo } from 'helper/videoRecognition';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useXRSession } from 'hooks/useXRSession';
import DropZone from 'react-dropzone';
import classNames from 'classnames';
import type { DropEvent, FileRejection } from 'react-dropzone';
import type { Format, Layout } from '@vr-viewer/player';

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [layout, setLayout] = useState<Layout>('stereoLeftRight');
  const [format, setFormat] = useState<Format>('180');

  const [file, setFile] = useState<File | undefined>();
  const [ready, setReady] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [detecting, setDetecting] = useState(false);

  const [xrSupported, requestXrSession, xrSession] = useXRSession();
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    const onLoadeddata = () => {
      if (!video) return;

      setTimeout(() => {
        setReady(true);
      }, 10);
    };

    video?.addEventListener('loadeddata', onLoadeddata);
    return () => {
      video?.removeEventListener('loadeddata', onLoadeddata);
    };
  }, []);

  useEffect(() => {
    if (autoDetect && ready && videoRef.current) {
      setDetecting(true);
      void recognizeVideo(videoRef.current).then(
        ([detectedLayout, detectedFormat]) => {
          if (detectedLayout) setLayout(detectedLayout);
          if (detectedFormat) setFormat(detectedFormat);
          setDetecting(false);
        },
      );
    }
  }, [autoDetect, ready]);

  useEffect(() => {
    let objectUrl = '';

    if (file && videoRef.current) {
      objectUrl = URL.createObjectURL(file);
      videoRef.current.src = objectUrl;

      setReady(false);
    }
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, requestXrSession]);

  const onFileDrop: <T extends File>(
    acceptedFiles: T[],
    fileRejections: FileRejection[],
    event: DropEvent,
  ) => void = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
  }, []);

  return (
    <DropZone noClick multiple={false} accept={'video/*'} onDrop={onFileDrop}>
      {({ getRootProps, getInputProps }) => (
        <>
          <div
            className="h-full flex flex-col bg-gray-900 text-white"
            {...getRootProps()}
          >
            <BugNotification />

            {videoRef.current && canvasRef.current && ready && debug && (
              <DebugPlayer
                video={videoRef.current}
                canvas={canvasRef.current}
                layout={layout}
                format={format}
              />
            )}
            {videoRef.current && canvasRef.current && ready && xrSession && (
              <VrPlayer
                xrSession={xrSession}
                video={videoRef.current}
                canvas={canvasRef.current}
                layout={layout}
                format={format}
              />
            )}

            <div className="flex flex-wrap items-center whitespace-nowrap">
              <Control
                aria-current={Boolean(xrSession)}
                disabled={!xrSupported}
                onClick={() => {
                  if (xrSession) {
                    void xrSession.end();
                  } else {
                    requestXrSession();
                  }
                }}
              >
                {
                  // eslint-disable-next-line no-nested-ternary
                  xrSupported
                    ? xrSession
                      ? 'Enter VR'
                      : 'Exit VR'
                    : 'VR not supported'
                }
              </Control>
              <label
                htmlFor="file-input"
                className="cursor-pointer flex m-2 py-2 px-4 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg shadow-sm"
              >
                Select file
                <input
                  id="file-input"
                  ref={fileInputRef}
                  {...getInputProps()}
                />
              </label>
              <Control
                aria-current={autoplay}
                onClick={() => setAutoplay(!autoplay)}
              >
                Autoplay
              </Control>
              <div className="flex relative">
                {detecting && (
                  <span
                    className="absolute top-1 right-1 h-3 w-3"
                    role="status"
                  >
                    <span className="sr-only">Loading...</span>
                    <span
                      role="presentation"
                      className="absolute h-full w-full rounded-full bg-white shadow-sm"
                    />
                    <span
                      role="presentation"
                      className="animate-ping absolute h-full w-full rounded-full bg-white"
                    />
                  </span>
                )}
                <Control
                  aria-current={autoDetect}
                  onClick={() => setAutoDetect(!autoDetect)}
                >
                  Detect settings
                </Control>
              </div>

              <GroupControl>
                <GroupControlElement
                  aria-current={layout === 'mono'}
                  onClick={() => setLayout('mono')}
                >
                  Mono
                </GroupControlElement>
                <GroupControlElement
                  aria-current={layout === 'stereoLeftRight'}
                  onClick={() => setLayout('stereoLeftRight')}
                >
                  Left | Right
                </GroupControlElement>
                <GroupControlElement
                  aria-current={layout === 'stereoTopBottom'}
                  onClick={() => setLayout('stereoTopBottom')}
                >
                  Top | Bottom
                </GroupControlElement>
              </GroupControl>
              <GroupControl>
                <GroupControlElement
                  aria-current={format === 'screen'}
                  onClick={() => setFormat('screen')}
                >
                  Screen
                </GroupControlElement>
                <GroupControlElement
                  aria-current={format === '180'}
                  onClick={() => setFormat('180')}
                >
                  180°
                </GroupControlElement>
                <GroupControlElement
                  aria-current={format === '360'}
                  onClick={() => setFormat('360')}
                >
                  360°
                </GroupControlElement>
              </GroupControl>
              <Control aria-current={debug} onClick={() => setDebug(!debug)}>
                Debug
              </Control>
            </div>
            <div className="flex-1 overflow-auto py-4">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                className={classNames('h-full mx-auto', { 'h-0': !ready })}
                ref={videoRef}
                preload="auto"
                controls
                autoPlay={autoplay}
                loop
              />
              <div
                hidden={ready}
                className={classNames(
                  'h-full flex justify-center items-center',
                  { hidden: ready },
                )}
              >
                <span className="p-8 text-xl font-medium">
                  Just drag and drop a video file anywhere to play!
                </span>
              </div>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            onClick={() => {
              setDebug(!debug);
            }}
            className={classNames(
              'absolute top-0 right-0 w-[640px] h-[360px]',
              {
                hidden: !debug || !ready,
              },
            )}
          />
        </>
      )}
    </DropZone>
  );
}

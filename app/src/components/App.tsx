import { BugNotification } from './BugNotification';
import { DebugPlayer } from 'components/DebugPlayer';
import { UI } from './ui/UI';
import { VrPlayer } from 'components/VrPlayer';
import {
  autoDetectAtom,
  autoPlayAtom,
  debugAtom,
  detectingAtom,
  formatAtom,
  layoutAtom,
} from 'atoms/controls';
import { recognizeVideo } from 'helper/videoRecognition';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { xrSessionAtom } from 'atoms/xr';
import classNames from 'classnames';
import type { DropEvent, FileRejection } from 'react-dropzone';

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [layout, setLayout] = useAtom(layoutAtom);
  const [format, setFormat] = useAtom(formatAtom);

  const [debug, setDebug] = useAtom(debugAtom);

  const [autoPlay] = useAtom(autoPlayAtom);
  const [autoDetect] = useAtom(autoDetectAtom);

  const [xrSession] = useAtom(xrSessionAtom);

  const [file, setFile] = useState<File | undefined>();
  const [ready, setReady] = useState(false);

  const [, setDetecting] = useAtom(detectingAtom);

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
  }, [autoDetect, ready, setDetecting, setFormat, setLayout]);

  useEffect(() => {
    const video = videoRef.current;

    const onLoadeddata = () => {
      if (!video) return;

      setReady(true);
    };

    video?.addEventListener('loadeddata', onLoadeddata);
    return () => {
      video?.removeEventListener('loadeddata', onLoadeddata);
    };
  }, [setReady]);

  useEffect(() => {
    let objectUrl = '';

    if (file && videoRef.current) {
      objectUrl = URL.createObjectURL(file);

      setReady(false);
      videoRef.current.src = objectUrl;
    }
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, setReady]);

  const onFileDrop: <T extends File>(
    acceptedFiles: T[],
    fileRejections: FileRejection[],
    event: DropEvent,
  ) => void = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    noClick: true,
    multiple: false,
    accept: 'video/*',
    onDrop: onFileDrop,
  });

  return (
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

      <UI fileInputProps={getInputProps()} />
      <div className="flex-1 overflow-auto py-4">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          className={classNames('h-full mx-auto shadow-sm', {
            'h-0': !ready,
          })}
          ref={videoRef}
          preload="auto"
          controls
          autoPlay={autoPlay}
          loop
        />
        <div
          hidden={ready}
          className={classNames('h-full flex justify-center items-center', {
            hidden: ready,
          })}
        >
          <span className="p-8 text-xl font-medium">
            Just drag and drop a video file anywhere to play!
          </span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onClick={() => {
          setDebug(!debug);
        }}
        className={classNames('absolute top-0 right-0 w-[640px] h-[360px]', {
          hidden: !debug || !ready,
        })}
      />
    </div>
  );
}

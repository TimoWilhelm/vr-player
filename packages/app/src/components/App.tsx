import { BugNotification } from './BugNotification';
import { DebugPlayer } from 'components/DebugPlayer';
import { DocumentDownloadIcon, XIcon } from '@heroicons/react/solid';
import { Toaster, toast } from 'react-hot-toast';
import { UI } from './ui/UI';
import { VrPlayer } from 'components/VrPlayer';
import {
  autoDetectAtom,
  autoPlayAtom,
  debugAtom,
  detectingAtom,
  flipLayoutAtom,
  formatAtom,
  layoutAtom,
} from 'atoms/controls';
import { getImageFrames } from 'helper/getImageFrames';
import { transfer, wrap } from 'comlink';
import { useAtom, useSetAtom } from 'jotai';
import { useDraggable } from 'hooks/useDraggable';
import { useDropzone } from 'react-dropzone';
import { useEffect, useRef, useState } from 'react';
import { useXRSession } from 'hooks/useXRSession';
import classNames from 'classnames';
import type { VideoRecognitionWorker } from 'worker/videoRecognition.worker';

const worker = wrap<VideoRecognitionWorker>(
  new Worker(new URL('worker/videoRecognition.worker', import.meta.url)),
);

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [layout, setLayout] = useAtom(layoutAtom);
  const [flipLayout] = useAtom(flipLayoutAtom);
  const [format, setFormat] = useAtom(formatAtom);

  const [debug, setDebug] = useAtom(debugAtom);

  const [autoPlay] = useAtom(autoPlayAtom);
  const [autoDetect] = useAtom(autoDetectAtom);

  const [file, setFile] = useState<File | null>(null);
  const [ready, setReady] = useState(false);

  const [, xrSession] = useXRSession();

  const setDetecting = useSetAtom(detectingAtom);

  useEffect(() => {
    if (ready && videoRef.current && autoDetect) {
      setDetecting(true);

      void (async (video) => {
        const frames = await getImageFrames(video);

        const [detectedLayout, detectedFormat] = await worker.recognizeVideo(
          transfer(frames, [...frames.map((frame) => frame.data.buffer)]),
        );

        if (detectedLayout) setLayout(detectedLayout);
        if (detectedFormat) setFormat(detectedFormat);

        setDetecting(false);
      })(videoRef.current);
    }
  }, [autoDetect, ready, setDetecting, setFormat, setLayout]);

  useEffect(() => {
    let objectUrl = '';

    if (file && videoRef.current) {
      setReady(false);

      objectUrl = URL.createObjectURL(file);
      videoRef.current.src = objectUrl;
    }

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, setReady]);

  const draggableRef = useDraggable();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    multiple: false,
    accept: 'video/*',
    onDropAccepted: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
    },
    onDropRejected: (rejection) => {
      toast.error(rejection[0].errors[0].message);
    },
  });

  return (
    <div
      className="h-full flex flex-col bg-gray-900 text-white"
      {...getRootProps()}
    >
      <Toaster position="bottom-center" reverseOrder={false} />

      <BugNotification />

      {videoRef.current && canvasRef.current && ready && debug && (
        <DebugPlayer
          video={videoRef.current}
          canvas={canvasRef.current}
          layout={layout}
          flipLayout={flipLayout}
          format={format}
        />
      )}
      {videoRef.current && canvasRef.current && ready && xrSession && (
        <VrPlayer
          xrSession={xrSession}
          video={videoRef.current}
          canvas={canvasRef.current}
          layout={layout}
          flipLayout={flipLayout}
          format={format}
        />
      )}

      <div className="mr-10">
        <UI fileInputProps={getInputProps()} />
      </div>

      <div className="flex-1 overflow-auto py-4">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          className={classNames('h-full mx-auto shadow-sm', {
            'h-0': !ready,
          })}
          ref={videoRef}
          playsInline
          preload="auto"
          controls
          autoPlay={autoPlay}
          loop
          onLoadedData={() => setReady(true)}
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
      <div
        ref={draggableRef}
        className={classNames(
          'absolute w-[640px] h-[360px] bg-gray-500 border border-white cursor-move',
          {
            hidden: !debug,
          },
        )}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
        <button
          type="button"
          className="absolute top-0 right-0"
          onClick={() => {
            setDebug(!debug);
          }}
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
      <div
        className={classNames(
          'absolute w-full h-full pointer-events-none flex items-center justify-center',
          {
            hidden: !isDragActive,
          },
        )}
      >
        <div className="absolute w-full h-full bg-black opacity-50 border-8 border-dashed" />
        <div className="w-10 h-10 z-10 animate-bounce ">
          <DocumentDownloadIcon />
        </div>
      </div>
    </div>
  );
}

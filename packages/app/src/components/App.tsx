import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { DebugPlayer } from 'components/DebugPlayer';
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
  videoUrlAtom,
} from 'atoms/controls';
import { getImageFrames } from 'helper/getImageFrames';
import { transfer, wrap } from 'comlink';
import { useAtom, useSetAtom } from 'jotai';
import { useDropzone } from 'react-dropzone';
import { useEffect, useRef, useState } from 'react';
import { useXRSession } from 'hooks/useXRSession';
import clsx from 'clsx';
import type { VideoRecognitionWorker } from 'worker/videoRecognition.worker';

const worker = wrap<VideoRecognitionWorker>(
  new Worker(new URL('worker/videoRecognition.worker', import.meta.url)),
);

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const [layout, setLayout] = useAtom(layoutAtom);
  const [flipLayout] = useAtom(flipLayoutAtom);
  const [format, setFormat] = useAtom(formatAtom);

  const [debug, setDebug] = useAtom(debugAtom);

  const [autoPlay] = useAtom(autoPlayAtom);
  const [autoDetect] = useAtom(autoDetectAtom);

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useAtom(videoUrlAtom);
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

    if (file) {
      objectUrl = URL.createObjectURL(file);
      setVideoUrl(objectUrl);
    }

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, setVideoUrl]);

  useEffect(() => {
    if (ready && urlInputRef.current) {
      urlInputRef.current.value = '';
    }
  }, [ready]);

  useEffect(() => {
    if (videoRef.current) {
      setReady(false);
      videoRef.current.src = videoUrl ?? '';
    }
  }, [videoUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    multiple: false,
    accept: {
      'video/*': [],
    },
    onDropAccepted: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
    },
    onDropRejected: (rejection) => {
      toast.error(rejection[0].errors[0].message);
    },
  });

  return (
    <div
      className="h-full flex-1 flex flex-col text-white grid-effect"
      {...getRootProps()}
    >
      <Toaster position="bottom-center" reverseOrder={false} />
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
        <video
          className={clsx('mx-auto shadow-lg rounded', [
            ready ? 'h-full' : 'h-0',
          ])}
          ref={videoRef}
          playsInline
          preload="auto"
          controls
          autoPlay={autoPlay}
          loop
          onLoadedData={() => setReady(true)}
          crossOrigin="anonymous"
        />
        <div
          hidden={ready}
          className={clsx(
            'h-full flex flex-col justify-center items-center gap-2',
            {
              hidden: ready,
            },
          )}
        >
          <div className="text-center text-xl font-medium">
            <span className="inline-block">
              Just drag and drop a video file anywhere to play!
            </span>{' '}
            <span className="inline-block">(It never leaves your browser)</span>
          </div>
          <div className="flex items-center justify-center gap-4 w-full px-4">
            <hr className="max-w-64 h-0.5 bg-gray-200 border-0 rounded flex-1" />
            or
            <hr className="max-w-64 h-0.5 my-8 bg-gray-200 border-0 rounded flex-1" />
          </div>
          <div className="flex flex-col items-center">
            <label htmlFor="url-input" className="font-semibold">
              Enter Video URL
            </label>
            <div>
              <input
                type="url"
                autoComplete="off"
                spellCheck="false"
                autoCorrect="off"
                autoCapitalize="off"
                ref={urlInputRef}
                id="url-input"
                className="w-96 p-2 my-4 bg-gray-800 text-white rounded border border-gray-600"
                placeholder="https://example.com/video.mp4"
                onChange={(e) => {
                  if (e.target.value) {
                    setVideoUrl(e.target.value);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className={clsx(
          'fixed max-h-[360px] aspect-video h-[30vh] bg-gray-600 border-2 border-white rounded bottom-2 right-2',
          {
            hidden: !debug,
          },
        )}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
        <button
          type="button"
          className="absolute top-0 right-0 p-3"
          onClick={() => {
            setDebug(!debug);
          }}
          aria-label="Close preview"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      <div
        className={clsx(
          'absolute w-full h-full pointer-events-none flex items-center justify-center',
          {
            hidden: !isDragActive,
          },
        )}
      >
        <div className="absolute w-full h-full bg-black opacity-50 border-8 border-dashed" />
        <div className="w-10 h-10 z-10 animate-bounce ">
          <ArrowDownTrayIcon />
        </div>
      </div>
    </div>
  );
}

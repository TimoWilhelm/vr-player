import { detectFormat, detectLayout } from './videoRecognition';
import { expose } from 'comlink';
import type { Format, Layout } from '@vr-viewer/player';

export function recognizeVideo(frames: ImageData[]): [Layout?, Format?] {
  const layout = detectLayout(frames);
  const format = detectFormat(frames);

  return [layout, format];
}

const module = { recognizeVideo };

expose(module);

export type VideoRecognitionWorker = typeof module;

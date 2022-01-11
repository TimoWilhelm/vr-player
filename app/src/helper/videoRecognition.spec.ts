import { detectLayout } from './videoRecognition';
import type { Layout } from '@vr-viewer/player';

const IMAGE_WIDTH = 4;
const IMAGE_HEIGHT = 4;

describe('Test video recognition', () => {
  test('Detect top/bottom video', () => {
    const pixels = new Array<number[]>(IMAGE_HEIGHT).fill(
      [
        ...new Array<number[]>(IMAGE_WIDTH / 2).fill([0, 0, 0, 1]),
        ...new Array<number[]>(IMAGE_WIDTH / 2).fill([1, 1, 1, 1]),
      ].flat(),
    );

    const imageData = new ImageData(
      Uint8ClampedArray.from(pixels.flat()),
      IMAGE_WIDTH,
      IMAGE_HEIGHT,
    );

    expect(detectLayout([imageData])).toBe<Layout>('stereoTopBottom');
  });

  test('Detect left/right video', () => {
    const pixels = [
      ...new Array<number[]>(IMAGE_WIDTH * (IMAGE_HEIGHT / 2)).fill([
        0, 0, 0, 1,
      ]),
      ...new Array<number[]>(IMAGE_WIDTH * (IMAGE_HEIGHT / 2)).fill([
        1, 1, 1, 1,
      ]),
    ];

    const imageData = new ImageData(
      Uint8ClampedArray.from(pixels.flat()),
      IMAGE_WIDTH,
      IMAGE_HEIGHT,
    );

    expect(detectLayout([imageData])).toBe<Layout>('stereoLeftRight');
  });

  test('Detect mono video', () => {
    const pixels = new Array<number[]>((IMAGE_WIDTH * IMAGE_HEIGHT) / 2).fill(
      [...[0, 0, 0, 1], ...[1, 1, 1, 1]].flat(),
    );

    const imageData = new ImageData(
      Uint8ClampedArray.from(pixels.flat()),
      IMAGE_WIDTH,
      IMAGE_HEIGHT,
    );

    expect(detectLayout([imageData])).toBe<Layout>('mono');
  });
});

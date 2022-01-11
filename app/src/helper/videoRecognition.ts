import type { Format, Layout } from '@vr-viewer/player';

function* nWise<T>(n: number, iterable: Iterable<T>): Generator<Array<T>> {
  const iterator = iterable[Symbol.iterator]();
  let current = iterator.next();

  let tmp = [];

  while (!current.done) {
    tmp.push(current.value);
    if (tmp.length === n) {
      yield tmp;
      tmp = [];
    }

    current = iterator.next();
  }
}

function linSpace(startValue: number, stopValue: number, cardinality: number) {
  const arr = [];
  const step = (stopValue - startValue) / (cardinality - 1);
  for (let i = 0; i < cardinality; i += 1) {
    arr.push(startValue + step * i);
  }
  return arr;
}

function getPixelDiff(a: number[][], b: number[][]) {
  const diffs = a.map((pixel, index) => {
    const rDiff = pixel[0] - b[index][0];
    const gDiff = pixel[1] - b[index][1];
    const bDiff = pixel[2] - b[index][2];
    return Math.sqrt(rDiff ** 2 + gDiff ** 2 + bDiff ** 2);
  });
  const average = diffs.reduce((_a, _b) => _a + _b, 0) / diffs.length;
  return average;
}

function getPixelRow(imageData: ImageData, row: number) {
  const rowData = imageData.data.slice(
    row * imageData.width * 4,
    (row + 1) * imageData.width * 4,
  );
  return Array.from(nWise(4, rowData));
}

function getPixelColumn(imageData: ImageData, column: number) {
  const columnPixels = [] as number[][];

  for (
    let i = column * 4;
    i < imageData.height * imageData.width * 4;
    i += imageData.width * 4
  ) {
    columnPixels.push(Array.from(imageData.data.slice(i, i + 4)));
  }

  return columnPixels;
}

export function detectLayout(frames: ImageData[]): Layout {
  const frameVertMirrorValues = frames.map((frame) => {
    const numRows = 30;
    const rowNumbers = linSpace(0, frame.height - 1, numRows).map((n) =>
      Math.floor(n),
    );

    const rows = rowNumbers.map((rowNumber) => getPixelRow(frame, rowNumber));

    const diffs = rows.map((row) => {
      return getPixelDiff(
        row.slice(0, frame.width / 2),
        row.slice(-(frame.width / 2)),
      );
    });

    const avgDiff = diffs.reduce((_a, _b) => _a + _b, 0) / diffs.length;
    return avgDiff;
  });

  const avgFrameVertMirrorValues =
    frameVertMirrorValues.reduce((a, b) => a + b, 0) /
    frameVertMirrorValues.length;

  const frameHorizontalMirrorValues = frames.map((frame) => {
    const numColumns = 30;
    const columnNumbers = linSpace(0, frame.width - 1, numColumns).map((n) =>
      Math.floor(n),
    );

    const columns = columnNumbers.map((columnNumber) =>
      getPixelColumn(frame, columnNumber),
    );

    const diffs = columns.map((column) => {
      return getPixelDiff(
        column.slice(0, frame.height / 2),
        column.slice(-(frame.height / 2)),
      );
    });

    const avgDiff = diffs.reduce((_a, _b) => _a + _b, 0) / diffs.length;
    return avgDiff;
  });

  const avgFrameHorizontalMirrorValues =
    frameHorizontalMirrorValues.reduce((a, b) => a + b, 0) /
    frameHorizontalMirrorValues.length;

  if (avgFrameVertMirrorValues < avgFrameHorizontalMirrorValues / 1.5) {
    return 'stereoLeftRight';
  }

  if (avgFrameHorizontalMirrorValues < avgFrameVertMirrorValues / 1.5) {
    return 'stereoTopBottom';
  }

  return 'mono';
}

export function detectFormat(frames: ImageData[]): Format {
  const frame = frames[0];

  const topRowPixels = getPixelRow(frame, 0);
  const bottomRowPixels = getPixelRow(frame, frame.height - 1);

  const topRowDiff = topRowPixels.map((pixel, i) => {
    if (i === topRowPixels.length - 1) {
      return 0;
    }
    return getPixelDiff([pixel], [topRowPixels[i + 1]]);
  });
  const avgTopRowDiff =
    topRowDiff.reduce((a, b) => a + b, 0) / topRowDiff.length;

  const bottomRowDiff = bottomRowPixels.map((pixel, i) => {
    if (i === bottomRowPixels.length - 1) {
      return 0;
    }

    return getPixelDiff([pixel], [bottomRowPixels[i + 1]]);
  });
  const avgBottomRowDiff =
    bottomRowDiff.reduce((a, b) => a + b, 0) / bottomRowDiff.length;

  if (avgTopRowDiff + avgBottomRowDiff < 1) {
    const leftColumn = getPixelColumn(frame, 0);
    const rightColumn = getPixelColumn(frame, frame.width - 1);

    const leftRightDiff = getPixelDiff(leftColumn, rightColumn);

    if (leftRightDiff < 10) {
      return '360';
    }

    return '180';
  }

  return 'screen';
}

async function getImageFrames(video: HTMLVideoElement): Promise<ImageData[]> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return [];
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const numberOfFrames = 5;

  const timeStamps = linSpace(
    video.duration * 0.2,
    video.duration * 0.8,
    numberOfFrames + 2,
  ).slice(1, -1);

  const videoClone = video.cloneNode(false) as HTMLVideoElement;

  const promises = timeStamps.map((timeStamp) => {
    return new Promise<ImageData>((resolve) => {
      const onSeeked = () => {
        videoClone.removeEventListener('seeked', onSeeked);
        ctx.drawImage(videoClone, 0, 0);
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      };

      videoClone.addEventListener('seeked', onSeeked);
      videoClone.currentTime = timeStamp;
    });
  });

  const frames = await Promise.all(promises);
  return frames;
}

export async function recognizeVideo(
  video: HTMLVideoElement,
): Promise<[Format?, Layout?]> {
  const imageFrames = await getImageFrames(video);

  return [detectFormat(imageFrames), detectLayout(imageFrames)];
}

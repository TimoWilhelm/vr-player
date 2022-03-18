import { linSpace, nWise } from 'helper/util';
import type { Format, Layout } from '@vr-viewer/player';

const PIXEL_RGBA_SIZE = 4;

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
    row * imageData.width * PIXEL_RGBA_SIZE,
    (row + 1) * imageData.width * PIXEL_RGBA_SIZE,
  );
  return Array.from(nWise(PIXEL_RGBA_SIZE, rowData));
}

function getPixelColumn(imageData: ImageData, column: number) {
  const columnPixels = [] as number[][];

  for (
    let i = column * PIXEL_RGBA_SIZE;
    i < imageData.height * imageData.width * PIXEL_RGBA_SIZE;
    i += imageData.width * PIXEL_RGBA_SIZE
  ) {
    columnPixels.push(Array.from(imageData.data.slice(i, i + PIXEL_RGBA_SIZE)));
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

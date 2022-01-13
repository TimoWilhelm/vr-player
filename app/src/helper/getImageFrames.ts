import { linSpace } from './util';

export async function getImageFrames(
  video: HTMLVideoElement,
): Promise<ImageData[]> {
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
  )
    .map((n) => Math.floor(n))
    .slice(1, -1);

  const videoClone = document.createElement('video');
  videoClone.src = video.src;
  videoClone.muted = true;
  videoClone.pause();

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

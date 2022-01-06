export class VideoLoader {
  public static async load(
    videoSrc: string,
    streaming = false,
  ): Promise<HTMLVideoElement> {
    const video = document.createElement('video');
    video.loop = true;

    if (streaming) {
      video.src = videoSrc;
    } else {
      const response = await fetch(videoSrc);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      video.src = url;
    }

    const frameLoaded = new Promise((resolve) => {
      video.onloadeddata = resolve;
    });

    void video.play();

    await frameLoaded;

    return video;
  }
}

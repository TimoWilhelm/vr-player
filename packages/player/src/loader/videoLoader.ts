export class VideoLoader {
  public static async load(videoSrc: string): Promise<HTMLVideoElement> {
    const video = document.createElement('video');
    video.src = videoSrc;
    video.loop = true;

    const videoLoaded = new Promise((resolve) => {
      video.onloadeddata = resolve;
    });

    void video.play();
    await videoLoaded;

    return video;
  }
}

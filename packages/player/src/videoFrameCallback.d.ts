interface HTMLVideoElement {
  requestVideoFrameCallback(
    callback: (
      now: DOMHighResTimeStamp,
      metadata: VideoFrameCallbackMetadata,
    ) => void,
  ): number;
  cancelVideoFrameCallback(handle: number): void;
}

interface VideoFrameCallbackMetadata {
  presentationTime: DOMHighResTimeStamp;
  expectedDisplayTime: DOMHighResTimeStamp;
  width: number;
  height: number;
  mediaTime: number;
  presentedFrames: number;
  processingDuration?: number;
  captureTime?: DOMHighResTimeStamp;
  receiveTime?: DOMHighResTimeStamp;
  rtpTimestamp?: number;
}

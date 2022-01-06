import { debug3 } from '@vr-viewer/player';

export function DebugPlayer() {
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          void debug3('/video/sample.mp4', 'stereoLeftRight');
        }}
      >
        Debug
      </button>
    </div>
  );
}

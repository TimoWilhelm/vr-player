import { debug } from '@vr-viewer/player';

export function DebugPlayer() {
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          debug('/video/sample.mp4', 'stereoLeftRight');
        }}
      >
        Debug
      </button>
    </div>
  );
}

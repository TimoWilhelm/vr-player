import { Control } from './Control';
import { GroupControl } from './GroupControl';
import { GroupControlElement } from './GroupControlElement';
import {
  autoDetectAtom,
  autoPlayAtom,
  debugAtom,
  detectingAtom,
  flipLayoutAtom,
  formatAtom,
  layoutAtom,
} from 'atoms/controls';
import { useAtom, useAtomValue } from 'jotai';
import { useXRSession } from 'hooks/useXRSession';
import classNames from 'classnames';
import type { DropzoneInputProps } from 'react-dropzone';

export function UI({ fileInputProps }: { fileInputProps: DropzoneInputProps }) {
  const [autoPlay, setAutoPlay] = useAtom(autoPlayAtom);
  const [autoDetect, setAutoDetect] = useAtom(autoDetectAtom);

  const detecting = useAtomValue(detectingAtom);

  const [layout, setLayout] = useAtom(layoutAtom);
  const [flipLayout, setFlipLayout] = useAtom(flipLayoutAtom);
  const [format, setFormat] = useAtom(formatAtom);

  const [debug, setDebug] = useAtom(debugAtom);

  const [xrSupported, xrSession, requestXrSession] = useXRSession();

  return (
    <div
      data-nosnippet
      className="flex flex-wrap items-start whitespace-nowrap"
    >
      <Control
        aria-current={Boolean(xrSession)}
        disabled={!xrSupported}
        onClick={() => {
          if (xrSession) {
            void xrSession.end();
          } else {
            requestXrSession();
          }
        }}
      >
        {
          // eslint-disable-next-line no-nested-ternary
          xrSupported
            ? xrSession
              ? 'Exit VR'
              : 'Enter VR'
            : 'VR Not Supported'
        }
      </Control>

      <label
        htmlFor="file-input"
        className="cursor-pointer flex m-2 py-2 px-4 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg shadow-sm"
      >
        Select File
        <input id="file-input" {...fileInputProps} />
      </label>

      <Control aria-current={autoPlay} onClick={() => setAutoPlay(!autoPlay)}>
        Autoplay
      </Control>

      <div className="flex relative">
        {detecting && (
          <span className="absolute top-1 right-1 h-3 w-3" role="status">
            <span className="sr-only">Loading...</span>
            <span
              role="presentation"
              className="absolute h-full w-full rounded-full bg-white shadow-sm"
            />
            <span
              role="presentation"
              className="animate-ping absolute h-full w-full rounded-full bg-white"
            />
          </span>
        )}
        <Control
          aria-current={autoDetect}
          onClick={() => setAutoDetect(!autoDetect)}
        >
          Detect Video Settings
        </Control>
      </div>

      <div className="flex flex-col items-center">
        <GroupControl>
          <GroupControlElement
            aria-current={layout === 'mono'}
            onClick={() => setLayout('mono')}
          >
            Mono
          </GroupControlElement>
          <GroupControlElement
            aria-current={layout === 'stereoLeftRight'}
            onClick={() => setLayout('stereoLeftRight')}
          >
            Left | Right
          </GroupControlElement>
          <GroupControlElement
            aria-current={layout === 'stereoTopBottom'}
            onClick={() => setLayout('stereoTopBottom')}
          >
            Top | Bottom
          </GroupControlElement>
        </GroupControl>

        <div
          className={classNames({
            hidden: !(
              layout === 'stereoLeftRight' || layout === 'stereoTopBottom'
            ),
          })}
        >
          <label htmlFor="flip-orientation-input" className="flex items-center">
            <input
              id="flip-orientation-input"
              type="checkbox"
              className="block w-4 h-4 mr-2"
              checked={flipLayout}
              onChange={() => {
                setFlipLayout(!flipLayout);
              }}
            />

            <div>Flip Layout</div>
          </label>
        </div>
      </div>

      <GroupControl>
        <GroupControlElement
          aria-current={format === 'screen'}
          onClick={() => setFormat('screen')}
        >
          Screen
        </GroupControlElement>
        <GroupControlElement
          aria-current={format === '180'}
          onClick={() => setFormat('180')}
        >
          180°
        </GroupControlElement>
        <GroupControlElement
          aria-current={format === '360'}
          onClick={() => setFormat('360')}
        >
          360°
        </GroupControlElement>
      </GroupControl>

      <Control aria-current={debug} onClick={() => setDebug(!debug)}>
        Preview
      </Control>

      <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://github.com/TimoWilhelm/vr-player"
        aria-label="View source on GitHub"
        className="flex m-2 py-2 px-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg shadow-sm"
      >
        <svg
          role="img"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5"
          fill="currentColor"
        >
          <title>GitHub</title>
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      </a>
    </div>
  );
}

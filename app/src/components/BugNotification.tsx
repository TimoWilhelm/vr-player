import { XIcon } from '@heroicons/react/solid';
import { useState } from 'react';
import classNames from 'classnames';

const isChromium = navigator.userAgent.match(/Chrome\/\d+/) !== null;

export function BugNotification() {
  const [visible, setVisible] = useState(isChromium);

  return (
    <div
      className={classNames(
        'flex text-white text-center font-medium bg-red-900',
        { hidden: !visible },
      )}
    >
      <div className="flex-1">
        <span>
          Please note that chromium based browsers currently have an{' '}
          <a
            href="https://bugs.chromium.org/p/chromium/issues/detail?id=612542"
            className="text-blue-400 underline"
          >
            issue
          </a>{' '}
          that severely affects performance. For best results, please use
          Firefox.
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
        }}
        className="px-2"
      >
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

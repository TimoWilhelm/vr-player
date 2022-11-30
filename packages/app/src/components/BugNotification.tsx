import { XMarkIcon } from '@heroicons/react/24/solid';
import { atomWithStorage } from 'jotai/utils';
import { useAtom } from 'jotai';
import clsx from 'clsx';

const isChromium = navigator.userAgent.match(/Chrome\/\d+/) !== null;

const bugNotificationVisibleAtom = atomWithStorage(
  'bugNotificationVisible',
  isChromium,
);

export function BugNotification() {
  const [visible, setVisible] = useAtom(bugNotificationVisibleAtom);

  return (
    <aside className={clsx({ hidden: !visible })}>
      <div
        data-nosnippet
        className="flex text-white text-center font-medium bg-red-900"
      >
        <div className="flex-1">
          <span>
            Please note that chromium based browsers currently have an{' '}
            <a
              href="https://bugs.chromium.org/p/chromium/issues/detail?id=612542"
              className="text-blue-300 underline"
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
          aria-label="Close notification"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}

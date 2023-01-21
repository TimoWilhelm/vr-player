import clsx from 'clsx';

export function Control(
  props: Omit<React.HTMLProps<HTMLButtonElement>, 'type' | 'className'>,
) {
  const { 'aria-current': ariaCurrent } = props;

  return (
    <button
      type="button"
      className={clsx(
        'm-2 py-2 px-4 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg shadow-sm disabled:opacity-50 disabled:shadow-none disabled:hover:bg-gray-700',
        { 'bg-cyan-700 hover:bg-cyan-600': ariaCurrent },
      )}
      {...props}
    />
  );
}

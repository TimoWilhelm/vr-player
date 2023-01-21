import clsx from 'clsx';

export function GroupControlElement(
  props: Omit<React.HTMLProps<HTMLButtonElement>, 'type' | 'className'>,
) {
  const { 'aria-current': ariaCurrent } = props;

  return (
    <button
      type="button"
      className={clsx(
        'py-2 px-4 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border-gray-600 border-t border-b first:border last:border first:rounded-l-lg last:rounded-r-lg disabled:opacity-50 disabled:hover:bg-gray-700 ',
        { 'bg-cyan-700 hover:bg-cyan-600': ariaCurrent },
      )}
      {...props}
    />
  );
}

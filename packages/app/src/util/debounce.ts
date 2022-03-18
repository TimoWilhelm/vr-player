// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounceAnimationFrame<T extends (...args: any[]) => void>(
  fn: T,
): T {
  let handle: number | undefined;

  return ((...args: unknown[]) => {
    if (handle !== undefined) {
      window.cancelAnimationFrame(handle);
    }

    handle = window.requestAnimationFrame(() => {
      fn(...args);
    });
  }) as T;
}

export function* nWise<T>(
  n: number,
  iterable: Iterable<T>,
): Generator<Array<T>> {
  const iterator = iterable[Symbol.iterator]();
  let current = iterator.next();

  let tmp = [];

  while (!current.done) {
    tmp.push(current.value);
    if (tmp.length === n) {
      yield tmp;
      tmp = [];
    }

    current = iterator.next();
  }
}

export function linSpace(
  startValue: number,
  stopValue: number,
  cardinality: number,
) {
  const arr = [];
  const step = (stopValue - startValue) / (cardinality - 1);
  for (let i = 0; i < cardinality; i += 1) {
    arr.push(startValue + step * i);
  }
  return arr;
}

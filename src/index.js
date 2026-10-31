/**
 * Map `items` through `worker` with at most `concurrency` running at once.
 * Results keep input order. The first rejection stops new work from starting
 * and rejects the returned promise.
 * @template T, R
 * @param {Iterable<T>} items
 * @param {(item: T, index: number) => Promise<R> | R} worker
 * @param {{concurrency?: number}} [options]
 * @returns {Promise<R[]>}
 */
export async function pool(items, worker, { concurrency = 4 } = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError("concurrency must be a positive integer");
  }
  const list = [...items];
  const results = new Array(list.length);
  let next = 0;
  let failed = false;

  async function run() {
    while (!failed && next < list.length) {
      const index = next++;
      try {
        results[index] = await worker(list[index], index);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, list.length) }, run);
  await Promise.all(runners);
  return results;
}

/** Like `pool` but never rejects: each entry is {status, value|reason}. */
export async function poolSettled(items, worker, options) {
  return pool(
    items,
    (item, i) =>
      Promise.resolve()
        .then(() => worker(item, i))
        .then((value) => ({ status: "fulfilled", value }), (reason) => ({ status: "rejected", reason })),
    options,
  );
}

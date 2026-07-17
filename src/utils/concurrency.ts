/**
 * Run `worker` over `items` with at most `limit` calls in flight at once. A fixed
 * pool of runners pulls from a shared cursor, so a slow item never blocks the
 * items behind it (bounded concurrency, not fixed batches). Order of execution is
 * not guaranteed; use each worker's own side effects to record results.
 */
export async function mapWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  const size = Math.max(1, Math.min(limit, items.length))
  let cursor = 0

  async function runner(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      await worker(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: size }, runner))
}

const LIMIT = 35;
const WINDOW_MS = 10_000;
const MAX_RETRIES = 3;

class RateLimiter {
  private timestamps: number[] = [];
  private inflight = new Map<string, Promise<unknown>>();

  async throttle(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < WINDOW_MS);

    if (this.timestamps.length >= LIMIT) {
      const wait = WINDOW_MS - (now - this.timestamps[0]);
      await new Promise((resolve) => setTimeout(resolve, wait));
      return this.throttle();
    }

    this.timestamps.push(Date.now());
  }

  dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.inflight.has(key)) {
      return this.inflight.get(key) as Promise<T>;
    }

    const promise = fn().finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    return promise;
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    const status = (error as { status?: number }).status;
    const shouldRetry = retries > 0 && (status === 429 || (status ?? 0) >= 500);

    if (!shouldRetry) throw error;

    const backoff = (MAX_RETRIES - retries + 1) * 1000;
    await new Promise((resolve) => setTimeout(resolve, backoff));
    return withRetry(fn, retries - 1);
  }
}

export const rateLimiter = new RateLimiter();

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

class Cache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidateAll(): void {
    this.store.clear();
  }
}

export const TTL = {
  TRENDING: 5 * 60 * 1000,
  SEARCH: 2 * 60 * 1000,
  DETAILS: 30 * 60 * 1000,
  CREDITS: 30 * 60 * 1000,
  VIDEOS: 30 * 60 * 1000,
  PERSON: 30 * 60 * 1000,
  GENRES: 60 * 60 * 1000,
} as const;

export const cache = new Cache();

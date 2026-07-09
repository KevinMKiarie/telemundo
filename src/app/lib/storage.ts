import AsyncStorage from "@react-native-async-storage/async-storage";

const WATCHLIST_KEY = "watchlist";
const RECENT_SEARCHES_KEY = "recent_searches";
const MAX_RECENT_SEARCHES = 10;

export async function getWatchlist(): Promise<number[]> {
  const data = await AsyncStorage.getItem(WATCHLIST_KEY);

  return data ? JSON.parse(data) : [];
}

export async function addToWatchlist(movieId: number): Promise<void> {
  const current = await getWatchlist();

  if (current.includes(movieId)) return;

  await AsyncStorage.setItem(
    WATCHLIST_KEY,
    JSON.stringify([...current, movieId]),
  );
}

export async function removeFromWatchlist(movieId: number): Promise<void> {
  const current = await getWatchlist();
  const updated = current.filter((id) => id !== movieId);
  await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
}

export async function isInWatchlist(movieId: number): Promise<boolean> {
  const current = await getWatchlist();
  return current.includes(movieId);
}

export async function getRecentSearches(): Promise<string[]> {
  const data = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
  return data ? JSON.parse(data) : [];
}

export async function addRecentSearch(query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;
  const current = await getRecentSearches();
  const deduped = [trimmed, ...current.filter((q) => q !== trimmed)];
  await AsyncStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(deduped.slice(0, MAX_RECENT_SEARCHES))
  );
}

export async function removeRecentSearch(query: string): Promise<void> {
  const current = await getRecentSearches();
  await AsyncStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(current.filter((q) => q !== query))
  );
}

export async function clearRecentSearches(): Promise<void> {
  await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
}

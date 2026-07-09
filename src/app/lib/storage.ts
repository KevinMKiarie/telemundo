import AsyncStorage from "@react-native-async-storage/async-storage";

const WATCHLIST_KEY = "watchlist";

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
}

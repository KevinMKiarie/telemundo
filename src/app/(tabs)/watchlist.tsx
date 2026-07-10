import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useQueries } from '@tanstack/react-query';
import { useWatchlistStore } from '../store/watchlist';
import { fetchMovieDetails, IMAGE_URL } from '../lib/tmdb';

export default function WatchlistScreen() {
  const router = useRouter();
  const storeIds = useWatchlistStore((s) => s.ids);
  const loaded = useWatchlistStore((s) => s.loaded);
  const load = useWatchlistStore((s) => s.load);
  const ids = [...storeIds];

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['movie', id],
      queryFn: () => fetchMovieDetails(id),
    })),
  });

  const loading = !loaded || results.some((r) => r.isLoading);
  const movies = results.flatMap((r) => (r.data ? [r.data] : []));

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  if (movies.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black px-8">
        <Text className="text-5xl mb-4">🎬</Text>
        <Text className="text-black dark:text-white text-xl font-bold text-center">
          Your watchlist is empty
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          Tap + Add to Watchlist on any movie to save it here
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-white dark:bg-black"
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={movies}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/movie/${item.id}`)}
          className="flex-row gap-4 bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden">
          <Image
            source={item.poster_path ? `${IMAGE_URL}${item.poster_path}` : null}
            className="w-24 bg-gray-200 dark:bg-gray-800"
            style={{ aspectRatio: 2 / 3 }}
          />
          <View className="flex-1 justify-center py-3 pr-4">
            <Text
              className="text-black dark:text-white font-bold text-base"
              numberOfLines={2}>
              {item.title}
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              {item.release_date?.split('-')[0]}
            </Text>
            <Text className="text-yellow-500 text-sm mt-1">
              ⭐ {item.vote_average.toFixed(1)}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

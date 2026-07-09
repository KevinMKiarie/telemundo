import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getWatchlist } from '../lib/storage';
import { fetchMovieDetails, IMAGE_URL } from '../lib/tmdb';

type Movie = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
};

export default function WatchlistScreen() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        try {
          const ids = await getWatchlist();
          const details = await Promise.all(
            ids.map((id) => fetchMovieDetails(id))
          );
          setMovies(details);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [])
  );

  if (!loading && movies.length === 0) {
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

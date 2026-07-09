import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import type { Movie } from '../../types/tmdb';
import { IMAGE_URL, fetchMoviesByGenre } from '../lib/tmdb';

export default function GenreScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const genreId = Number(id);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: name ?? 'Genre' });
  }, [name]);

  useEffect(() => {
    load(1);
  }, [genreId]);

  async function load(pageNum: number, append = false) {
    try {
      const response = await fetchMoviesByGenre(genreId, pageNum);
      setMovies((prev) => (append ? [...prev, ...response.results] : response.results));
      setHasMore(pageNum < response.total_pages);
      setPage(pageNum);
    } catch (e) {
      setError('Failed to load movies.');
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load(1);
  }

  async function onEndReached() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await load(page + 1, true);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black px-6">
        <Text className="text-red-500 text-center">{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-white dark:bg-black"
      data={movies}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
      contentContainerStyle={{ gap: 12, paddingVertical: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#E50914"
        />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore ? (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color="#E50914" />
          </View>
        ) : null
      }
      renderItem={({ item }: { item: Movie }) => (
        <Pressable
          className="flex-1"
          onPress={() => router.push(`/movie/${item.id}`)}>
          <Image
            source={item.poster_path ? `${IMAGE_URL}${item.poster_path}` : null}
            className="w-full rounded-xl bg-gray-200 dark:bg-gray-800"
            style={{ aspectRatio: 2 / 3 }}
          />
          <Text
            className="text-black dark:text-white text-sm font-bold mt-1"
            numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-yellow-500 text-xs">
            ⭐ {item.vote_average.toFixed(1)}
          </Text>
        </Pressable>
      )}
    />
  );
}

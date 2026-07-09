import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Genre, Movie } from '../../types/tmdb';
import {
  IMAGE_URL,
  fetchGenres,
  fetchMoviesByCategory,
  fetchMoviesByGenre,
  fetchTrending,
  searchMovies,
} from '../lib/tmdb';

type Category = {
  key: 'trending' | 'popular' | 'top_rated' | 'upcoming' | 'now_playing';
  label: string;
};

const CATEGORIES: Category[] = [
  { key: 'trending', label: 'Trending' },
  { key: 'popular', label: 'Popular' },
  { key: 'top_rated', label: 'Top Rated' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'now_playing', label: 'Now Playing' },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [category, setCategory] = useState<Category['key']>('trending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGenres().then(setGenres).catch(console.error);
  }, []);

  useEffect(() => {
    const delay = query.trim() ? 500 : 0;
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getMovies(query, category, selectedGenre, 1);
        setMovies(response.results);
        setHasMore(1 < response.total_pages);
        setPage(1);
      } catch (e) {
        setError('Failed to load movies.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, delay);
    return () => clearTimeout(timeout);
  }, [query, category, selectedGenre]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      const response = await getMovies(query, category, selectedGenre, 1);
      setMovies(response.results);
      setHasMore(1 < response.total_pages);
      setPage(1);
    } finally {
      setRefreshing(false);
    }
  }

  async function onEndReached() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await getMovies(query, category, selectedGenre, nextPage);
      setMovies((prev) => [...prev, ...response.results]);
      setHasMore(nextPage < response.total_pages);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  }

  function selectCategory(key: Category['key']) {
    setCategory(key);
    setSelectedGenre(null);
    setQuery('');
  }

  function selectGenre(id: number | null) {
    setSelectedGenre(id);
    setQuery('');
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <View className="px-3 pt-3">
        <TextInput
          className="bg-gray-100 dark:bg-gray-900 text-black dark:text-white rounded-full px-4 py-3 mb-3 text-base"
          placeholder="Search movies..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {!query.trim() && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingBottom: 8 }}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                onPress={() => selectCategory(cat.key)}
                className={`px-4 h-9 rounded-full items-center justify-center ${
                  category === cat.key && !selectedGenre
                    ? 'bg-red-600'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                <Text
                  className={`text-xs font-medium ${
                    category === cat.key && !selectedGenre
                      ? 'text-white'
                      : 'text-black dark:text-white'
                  }`}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingBottom: 8 }}>
            <Pressable
              onPress={() => selectGenre(null)}
              className="px-4 h-9 rounded-full items-center justify-center bg-gray-100 dark:bg-gray-800">
              <Text className="text-xs font-medium text-black dark:text-white">
                All
              </Text>

            </Pressable>
            {genres.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => selectGenre(g.id)}
                className={`px-4 h-9 rounded-full items-center justify-center ${
                  selectedGenre === g.id
                    ? 'bg-red-600'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                <Text
                  className={`text-xs font-medium ${
                    selectedGenre === g.id
                      ? 'text-white'
                      : 'text-black dark:text-white'
                  }`}>
                  {g.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center">{error}</Text>
        </View>
      ) : loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 12 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 20, paddingTop: 8 }}
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
          renderItem={({ item }) => (
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
      )}
    </View>
  );
}

async function getMovies(
  query: string,
  category: Category['key'],
  genreId: number | null,
  page: number
) {
  if (query.trim()) return searchMovies(query, page);
  if (genreId) return fetchMoviesByGenre(genreId, page);
  if (category === 'trending') return fetchTrending(page);
  return fetchMoviesByCategory(category, page);
}

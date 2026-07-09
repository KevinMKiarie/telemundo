import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Movie } from '../../types/tmdb';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from '../lib/storage';
import { IMAGE_URL, searchMovies } from '../lib/tmdb';

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadRecent();
      inputRef.current?.focus();
    }, [])
  );

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await searchMovies(query, 1);
        setResults(response.results);
        await addRecentSearch(query);
        await loadRecent();
      } catch (e) {
        setError('Search failed. Try again.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [query]);

  async function loadRecent() {
    const searches = await getRecentSearches();
    setRecentSearches(searches);
  }

  async function handleRemoveRecent(q: string) {
    await removeRecentSearch(q);
    await loadRecent();
  }

  async function handleClearAll() {
    await clearRecentSearches();
    setRecentSearches([]);
  }

  const showRecent = !query.trim() && recentSearches.length > 0;
  const showEmpty = !query.trim() && recentSearches.length === 0;

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <View className="px-3 pt-3 pb-2">
        <TextInput
          ref={inputRef}
          className="bg-gray-100 dark:bg-gray-900 text-black dark:text-white rounded-full px-4 py-3 text-base"
          placeholder="Search movies, actors..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {showEmpty && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-4xl mb-3">🔍</Text>
          <Text className="text-black dark:text-white font-semibold text-lg">
            Search movies
          </Text>
          <Text className="text-gray-500 text-sm mt-1">
            Your recent searches will appear here
          </Text>
        </View>
      )}

      {showRecent && (
        <View className="px-4 pt-2">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-black dark:text-white font-bold text-base">
              Recent
            </Text>
            <Pressable onPress={handleClearAll}>
              <Text className="text-red-600 text-sm font-medium">Clear all</Text>
            </Pressable>
          </View>
          {recentSearches.map((q) => (
            <Pressable
              key={q}
              onPress={() => setQuery(q)}
              className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
              <View className="flex-row items-center gap-3">
                <Text className="text-gray-400">🕐</Text>
                <Text className="text-black dark:text-white text-base">{q}</Text>
              </View>
              <Pressable
                onPress={() => handleRemoveRecent(q)}
                hitSlop={8}>
                <Text className="text-gray-400 text-lg">✕</Text>
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}

      {error && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center">{error}</Text>
        </View>
      )}

      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      )}

      {!loading && !error && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 12 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 20, paddingTop: 8 }}
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

import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { fetchTrending, IMAGE_URL, searchMovies } from "../lib/tmdb";

type Movie = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
};

export default function DiscoverScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const delay = query.trim() ? 500 : 0;

    const timeout = setTimeout(async () => {
      setLoading(true);
      const results = query.trim()
        ? await searchMovies(query)
        : await fetchTrending();
      setMovies(results);
      setLoading(false);
    }, delay);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <View className="flex-1 bg-white dark:bg-black px-3 pt-3">
      <TextInput
        className="bg-blue-100 dark:bg-gray-900 text-black dark:text-white rounded-full px-4 py-3 mb-4 text-base"
        placeholder="Search movies today..."
        placeholderTextColor="#999"
        value={query}
        onChangeText={setQuery}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <Pressable
              className="flex-1"
              onPress={() => router.push(`/movie/${item.id}`)}
            >
              <Image
                source={
                  item.poster_path ? `${IMAGE_URL}${item.poster_path}` : null
                }
                className="w-full rounded-xl bg-gray-200 dark:bg-gray-800"
                style={{ aspectRatio: 2 / 3 }}
              />
              <Text
                className="text-black dark:text-white text-sm font-medium mt-1"
                numberOfLines={1}
              >
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

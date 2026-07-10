import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { Movie, Person } from '../../types/tmdb';
import { IMAGE_URL, fetchPerson, fetchPersonMovies } from '../lib/tmdb';

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const personId = Number(id);

  const [person, setPerson] = useState<Person | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [personData, movieData] = await Promise.all([
          fetchPerson(personId),
          fetchPersonMovies(personId),
        ]);
        setPerson(personData);
        navigation.setOptions({ title: personData.name });
        const sorted = movieData.cast
          .filter((m) => m.poster_path)
          .sort((a, b) => b.popularity - a.popularity);
        setMovies(sorted);
      } catch (e) {
        setError('Failed to load person details.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [personId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  if (error || !person) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black px-6">
        <Text className="text-red-500 text-center">
          {error ?? 'Person not found.'}
        </Text>
      </View>
    );
  }

  const bio = person.biography || 'No biography available.';
  const truncated = bio.length > 300 && !expanded;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-black">
      <View className="items-center px-6 pt-6 pb-4">
        <Image
          source={
            person.profile_path
              ? `${IMAGE_URL}${person.profile_path}`
              : null
          }
          style={{ width: 144, height: 144, borderRadius: 72 }}
          className="bg-gray-200 dark:bg-gray-800"
        />
        <Text className="text-black dark:text-white text-2xl font-bold mt-4 text-center">
          {person.name}
        </Text>
        <Text className="text-gray-500 text-sm mt-1">
          {person.known_for_department}
        </Text>
        {person.birthday && (
          <Text className="text-gray-400 text-xs mt-1">
            Born {person.birthday}
            {person.place_of_birth ? ` · ${person.place_of_birth}` : ''}
          </Text>
        )}
      </View>

      <View className="px-6 mb-6">
        <Text className="text-black dark:text-white text-base leading-6">
          {truncated ? `${bio.slice(0, 300)}...` : bio}
        </Text>
        {bio.length > 300 && (
          <Pressable onPress={() => setExpanded(!expanded)} className="mt-2">
            <Text className="text-red-600 font-medium text-sm">
              {expanded ? 'Show less' : 'Read more'}
            </Text>
          </Pressable>
        )}
      </View>

      {movies.length > 0 && (
        <View className="mb-8">
          <Text className="text-black dark:text-white text-lg font-bold px-6 mb-3">
            Known For
          </Text>
          <FlatList
            data={movies}
            keyExtractor={(item: Movie) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            renderItem={({ item }: { item: Movie }) => (
              <Pressable
                className="w-32"
                onPress={() => router.push(`/movie/${item.id}`)}>
                <Image
                  source={`${IMAGE_URL}${item.poster_path}`}
                  className="w-32 rounded-xl bg-gray-200 dark:bg-gray-800"
                  style={{ aspectRatio: 2 / 3 }}
                />
                <Text
                  className="text-black dark:text-white text-xs font-medium mt-1"
                  numberOfLines={2}>
                  {item.title}
                </Text>
                <Text className="text-yellow-500 text-xs">
                  ⭐ {item.vote_average.toFixed(1)}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </ScrollView>
  );
}

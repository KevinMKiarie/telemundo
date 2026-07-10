import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import type { Genre } from '../../types/tmdb';
import { fetchGenres } from '../lib/tmdb';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type GenreMeta = {
  color: string;
  icon: IoniconName;
};

const GENRE_META: Record<number, GenreMeta> = {
  28:    { color: '#E50914', icon: 'flash' },
  12:    { color: '#F97316', icon: 'compass' },
  16:    { color: '#EAB308', icon: 'color-palette' },
  35:    { color: '#22C55E', icon: 'happy' },
  80:    { color: '#6366F1', icon: 'finger-print' },
  99:    { color: '#14B8A6', icon: 'videocam' },
  18:    { color: '#8B5CF6', icon: 'people' },
  10751: { color: '#EC4899', icon: 'home' },
  14:    { color: '#3B82F6', icon: 'sparkles' },
  36:    { color: '#D97706', icon: 'library' },
  27:    { color: '#DC2626', icon: 'skull' },
  10402: { color: '#7C3AED', icon: 'musical-notes' },
  9648:  { color: '#1D4ED8', icon: 'search' },
  10749: { color: '#F43F5E', icon: 'heart' },
  878:   { color: '#06B6D4', icon: 'rocket' },
  10770: { color: '#65A30D', icon: 'tv' },
  53:    { color: '#B91C1C', icon: 'alert-circle' },
  10752: { color: '#4B5563', icon: 'medal' },
  37:    { color: '#92400E', icon: 'sunny' },
};

const DEFAULT_META: GenreMeta = { color: '#6B7280', icon: 'film-outline' };

export default function GenresScreen() {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenres()
      .then(setGenres)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-white dark:bg-black"
      data={genres}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
      contentContainerStyle={{ gap: 12, paddingVertical: 16 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const meta = GENRE_META[item.id] ?? DEFAULT_META;
        return (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/genre/${item.id}?name=${encodeURIComponent(item.name)}`);
            }}
            className="flex-1 h-24 rounded-2xl items-center justify-center gap-2"
            style={{ backgroundColor: meta.color }}>
            <Ionicons name={meta.icon} size={28} color="white" />
            <Text className="text-white font-bold text-sm text-center px-2">
              {item.name}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { addToWatchlist, isInWatchlist, removeFromWatchlist } from '../lib/storage';
import { fetchMovieDetails } from '../lib/tmdb';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

type MovieDetail = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  runtime: number;
  genres: { id: number; name: string }[];
  tagline: string;
};

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMovieDetails(Number(id));
        setMovie(data);
        const saved = await isInWatchlist(Number(id));
        setInWatchlist(saved);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function toggleWatchlist() {
    if (!movie) return;
    if (inWatchlist) {
      await removeFromWatchlist(movie.id);
      setInWatchlist(false);
    } else {
      await addToWatchlist(movie.id);
      setInWatchlist(true);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <Text className="text-red-500">Movie not found.</Text>
      </View>
    );
  }

  const year = movie.release_date?.split('-')[0];
  const hours = Math.floor(movie.runtime / 60);
  const mins = movie.runtime % 60;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-black">
      <Image
        source={movie.backdrop_path ? `${IMAGE_BASE}${movie.backdrop_path}` : null}
        style={{ width: '100%', aspectRatio: 16 / 9 }}
        className="bg-gray-200 dark:bg-gray-800"
      />

      <View className="flex-row px-4 -mt-16 mb-4 gap-4">
        <Image
          source={movie.poster_path ? `${IMAGE_BASE}${movie.poster_path}` : null}
          className="w-28 rounded-xl bg-gray-300 dark:bg-gray-700"
          style={{ aspectRatio: 2 / 3 }}
        />
        <View className="flex-1 pt-16">
          <Text
            className="text-black dark:text-white text-5xl font-bold"
            numberOfLines={2}>
            {movie.title}
          </Text>
          <Text className="text-gray-500 text-sm mt-1">
            {year}  {hours}h {mins}m
          </Text>
          <Text className="text-yellow-500 text-sm mt-1">
            ⭐ {movie.vote_average.toFixed(1)} / 10
          </Text>
        </View>
      </View>

      <View className="px-4">
        {movie.tagline ? (
          <Text className="text-gray-400 italic text-sm mb-3">
            "{movie.tagline}"
          </Text>
        ) : null}

        <View className="flex-row flex-wrap gap-2 mb-4">
          {movie.genres.map((g) => (
            <View
              key={g.id}
              className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              <Text className="text-gray-700 dark:text-gray-300 text-xs">
                {g.name}
              </Text>
            </View>
          ))}
        </View>

        <Text className="text-black dark:text-white text-base leading-6 mb-6">
          {movie.overview}
        </Text>

        <Pressable
          onPress={toggleWatchlist}
          className={`py-4 rounded-2xl items-center mb-8 ${
            inWatchlist ? 'bg-gray-200 dark:bg-gray-700' : 'bg-red-600'
          }`}>
          <Text
            className={`font-bold text-base ${
              inWatchlist ? 'text-black dark:text-white' : 'text-white'
            }`}>
            {inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { CastMember, Movie, Video, WatchProvider } from '../../types/tmdb';
import { streamAITake } from '../lib/ai';
import { useWatchlistStore } from '../store/watchlist';
import {
  BACKDROP_URL,
  IMAGE_URL,
  fetchMovieCredits,
  fetchMovieDetails,
  fetchMovieVideos,
  fetchSimilarMovies,
  fetchWatchProviders,
} from '../lib/tmdb';

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const movieId = Number(id);

  const { data, isLoading } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () =>
      Promise.all([
        fetchMovieDetails(movieId),
        fetchMovieCredits(movieId),
        fetchMovieVideos(movieId),
        fetchSimilarMovies(movieId),
        fetchWatchProviders(movieId),
      ]),
  });

  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (data) navigation.setOptions({ title: data[0].title });
  }, [data]);

  const inWatchlist = useWatchlistStore((s) => s.has(movieId));
  const addToWatchlist = useWatchlistStore((s) => s.add);
  const removeFromWatchlist = useWatchlistStore((s) => s.remove);

  async function toggleWatchlist() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (inWatchlist) {
      await removeFromWatchlist(movieId);
    } else {
      await addToWatchlist(movieId);
    }
  }

  async function openTrailer() {
    if (!trailer) return;
    await openBrowserAsync(`https://www.youtube.com/watch?v=${trailer.key}`);
  }

  async function getAITake() {
    if (!movie || aiLoading) return;
    setAiText('');
    setAiLoading(true);
    try {
      await streamAITake(
        movie.title,
        movie.genres.map((g) => g.name),
        movie.overview,
        (chunk) => setAiText((prev) => prev + chunk)
      );
    } catch {
      setAiText('Could not load AI take. Try again.');
    } finally {
      setAiLoading(false);
    }
  }

  async function shareMovie() {
    if (!movie) return;
    await Share.share({
      title: movie.title,
      message: `Check out ${movie.title} — https://www.themoviedb.org/movie/${movie.id}`,
    });
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <Text className="text-red-500">Movie not found.</Text>
      </View>
    );
  }

  const [movie, credits, videos, similarMovies, watchProviders] = data;
  const similar = similarMovies.results.slice(0, 10);
  const providers = watchProviders.results?.US ?? null;
  const trailer: Video | null =
    videos.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ??
    videos.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ??
    null;

  const year = movie.release_date?.split('-')[0];
  const hours = Math.floor(movie.runtime / 60);
  const mins = movie.runtime % 60;
  const director = credits?.crew.find((c) => c.job === 'Director');
  const topCast = credits?.cast.slice(0, 15) ?? [];

  return (
    <ScrollView className="flex-1 bg-white dark:bg-black">
      <Image
        source={movie.backdrop_path ? `${BACKDROP_URL}${movie.backdrop_path}` : null}
        style={{ width: '100%', aspectRatio: 16 / 9 }}
        className="bg-gray-200 dark:bg-gray-800"
      />

      <View className="flex-row px-4 -mt-16 mb-4 gap-4">
        <Image
          source={movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : null}
          className="w-28 rounded-xl bg-gray-300 dark:bg-gray-700"
          style={{ aspectRatio: 2 / 3 }}
        />
        <View className="flex-1 pt-16">
          <Text
            className="text-black dark:text-white text-xl font-bold"
            numberOfLines={3}>
            {movie.title}
          </Text>
          <Text className="text-gray-500 text-sm mt-1">
            {year}  {hours}h {mins}m
          </Text>
          <Text className="text-yellow-500 text-sm mt-1">
            ⭐ {movie.vote_average.toFixed(1)} / 10
          </Text>
          {director && (
            <Text className="text-gray-500 text-xs mt-1">
              Dir. {director.name}
            </Text>
          )}
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

        <View className="flex-row gap-3 mb-8">
          <Pressable
            onPress={toggleWatchlist}
            className={`flex-1 py-4 rounded-2xl items-center ${
              inWatchlist ? 'bg-gray-200 dark:bg-gray-700' : 'bg-red-600'
            }`}>
            <Text
              className={`font-bold text-sm ${
                inWatchlist ? 'text-black dark:text-white' : 'text-white'
              }`}>
              {inWatchlist ? '✓ Watchlist' : '+ Watchlist'}
            </Text>
          </Pressable>

          {trailer && (
            <Pressable
              onPress={openTrailer}
              className="flex-1 py-4 rounded-2xl items-center bg-gray-100 dark:bg-gray-800">
              <Text className="text-black dark:text-white font-bold text-sm">
                ▶ Trailer
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={shareMovie}
            className="py-4 px-5 rounded-2xl items-center bg-gray-100 dark:bg-gray-800">
            <Text className="text-black dark:text-white font-bold text-sm">
              ↑ Share
            </Text>
          </Pressable>
        </View>
      </View>

      {topCast.length > 0 && (
        <View className="mb-6">
          <Text className="text-black dark:text-white text-lg font-bold px-4 mb-3">
            Cast
          </Text>
          <FlatList
            data={topCast}
            keyExtractor={(item: CastMember) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            renderItem={({ item }: { item: CastMember }) => (
              <Pressable
                className="w-20 items-center"
                onPress={() => router.push(`/person/${item.id}`)}>
                <Image
                  source={
                    item.profile_path
                      ? `${IMAGE_URL}${item.profile_path}`
                      : null
                  }
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                  className="bg-gray-200 dark:bg-gray-800"
                />
                <Text
                  className="text-black dark:text-white text-xs font-medium mt-2 text-center"
                  numberOfLines={2}>
                  {item.name}
                </Text>
                <Text
                  className="text-gray-500 text-xs text-center"
                  numberOfLines={1}>
                  {item.character}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {similar.length > 0 && (
        <View className="mb-8">
          <Text className="text-black dark:text-white text-lg font-bold px-4 mb-3">
            Similar Movies
          </Text>
          <FlatList
            data={similar}
            keyExtractor={(item: Movie) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            renderItem={({ item }: { item: Movie }) => (
              <Pressable
                className="w-32"
                onPress={() => router.push(`/movie/${item.id}`)}>
                <Image
                  source={
                    item.poster_path
                      ? `${IMAGE_URL}${item.poster_path}`
                      : null
                  }
                  className="w-32 rounded-xl bg-gray-200 dark:bg-gray-800"
                  style={{ aspectRatio: 2 / 3 }}
                />
                <Text
                  className="text-black dark:text-white text-xs font-medium mt-1"
                  numberOfLines={2}>
                  {item.title}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}
      {providers && (
        <View className="px-4 mb-8">
          <Text className="text-black dark:text-white text-lg font-bold mb-3">
            Where to Watch
          </Text>
          {providers.flatrate && (
            <ProviderRow label="Stream" providers={providers.flatrate} link={providers.link} />
          )}
          {providers.rent && (
            <ProviderRow label="Rent" providers={providers.rent} link={providers.link} />
          )}
          {providers.buy && (
            <ProviderRow label="Buy" providers={providers.buy} link={providers.link} />
          )}
          {!providers.flatrate && !providers.rent && !providers.buy && (
            <Text className="text-gray-500 text-sm">
              Not available on streaming in your region.
            </Text>
          )}
        </View>
      )}

      <View className="px-4 mb-10">
        <Text className="text-black dark:text-white text-lg font-bold mb-3">
          AI Take
        </Text>
        {aiText ? (
          <Text className="text-black dark:text-white text-sm leading-6">
            {aiText}
            {aiLoading ? <Text className="text-red-500"> |</Text> : null}
          </Text>
        ) : (
          <Pressable
            onPress={getAITake}
            disabled={aiLoading}
            className="py-4 rounded-2xl items-center bg-gray-100 dark:bg-gray-800">
            <Text className="text-black dark:text-white font-bold text-sm">
              {aiLoading ? 'Thinking...' : '✦ Get AI Take'}
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function ProviderRow({
  label,
  providers,
  link,
}: {
  label: string;
  providers: WatchProvider[];
  link: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-gray-500 text-xs font-semibold uppercase mb-2">{label}</Text>
      <View className="flex-row flex-wrap gap-3">
        {providers.map((p) => (
          <Pressable
            key={p.provider_id}
            onPress={() => openBrowserAsync(link)}
            className="items-center gap-1">
            <Image
              source={`https://image.tmdb.org/t/p/original${p.logo_path}`}
              style={{ width: 44, height: 44, borderRadius: 10 }}
              className="bg-gray-200 dark:bg-gray-800"
            />
            <Text className="text-gray-500 text-xs text-center" numberOfLines={1}
              style={{ maxWidth: 56 }}>
              {p.provider_name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

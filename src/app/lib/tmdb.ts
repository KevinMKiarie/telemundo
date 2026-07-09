import { cache, TTL } from './cache';
import { rateLimiter, withRetry } from './rateLimit';
import type {
  Credits,
  Genre,
  MovieDetail,
  PaginatedResponse,
  Person,
  Movie,
  Video,
} from '../../types/tmdb';

const BASE_URL = 'https://api.themoviedb.org/3';
const TOKEN = process.env.EXPO_PUBLIC_TMDB_TOKEN;

export const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
export const BACKDROP_URL = 'https://image.tmdb.org/t/p/w1280';

async function get<T>(endpoint: string): Promise<T> {
  const cached = cache.get<T>(endpoint);
  if (cached) return cached;

  return rateLimiter.dedupe(endpoint, () =>
    withRetry(async () => {
      await rateLimiter.throttle();

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });

      if (!response.ok) {
        const error = new Error(`TMDB ${response.status}`);
        (error as unknown as { status: number }).status = response.status;
        throw error;
      }

      return response.json() as Promise<T>;
    })
  );
}

async function getCached<T>(endpoint: string, ttl: number): Promise<T> {
  const cached = cache.get<T>(endpoint);
  if (cached) return cached;

  const data = await get<T>(endpoint);
  cache.set(endpoint, data, ttl);
  return data;
}

export async function fetchTrending(page = 1): Promise<PaginatedResponse<Movie>> {
  return getCached(`/trending/movie/week?page=${page}`, TTL.TRENDING);
}

export async function searchMovies(query: string, page = 1): Promise<PaginatedResponse<Movie>> {
  return getCached(
    `/search/movie?query=${encodeURIComponent(query)}&page=${page}`,
    TTL.SEARCH
  );
}

export async function fetchMovieDetails(id: number): Promise<MovieDetail> {
  return getCached(`/movie/${id}`, TTL.DETAILS);
}

export async function fetchMovieCredits(id: number): Promise<Credits> {
  return getCached(`/movie/${id}/credits`, TTL.CREDITS);
}

export async function fetchMovieVideos(id: number): Promise<{ results: Video[] }> {
  return getCached(`/movie/${id}/videos`, TTL.VIDEOS);
}

export async function fetchSimilarMovies(id: number): Promise<PaginatedResponse<Movie>> {
  return getCached(`/movie/${id}/similar`, TTL.DETAILS);
}

export async function fetchMoviesByCategory(
  category: 'popular' | 'top_rated' | 'upcoming' | 'now_playing',
  page = 1
): Promise<PaginatedResponse<Movie>> {
  return getCached(`/movie/${category}?page=${page}`, TTL.TRENDING);
}

export async function fetchMoviesByGenre(
  genreId: number,
  page = 1
): Promise<PaginatedResponse<Movie>> {
  return getCached(
    `/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&page=${page}`,
    TTL.TRENDING
  );
}

export async function fetchGenres(): Promise<Genre[]> {
  const data = await getCached<{ genres: Genre[] }>('/genre/movie/list', TTL.GENRES);
  return data.genres;
}

export async function fetchPerson(id: number): Promise<Person> {
  return getCached(`/person/${id}`, TTL.PERSON);
}

export async function fetchPersonMovies(id: number): Promise<{ cast: Movie[]; crew: Movie[] }> {
  return getCached(`/person/${id}/movie_credits`, TTL.PERSON);
}

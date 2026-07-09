const BASE_URL = "https://api.themoviedb.org/3";
const TOKEN = process.env.EXPO_PUBLIC_TMDB_TOKEN;

export const IMAGE_URL = "https://image.tmdb.org/t/p/w500";

async function get(endpoint: string) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data;
}

export async function fetchTrending() {
  const data = await get("/trending/movie/week");
  return data.results;
}

export async function searchMovies(query: string) {
  const data = await get(`/search/movie?query=${encodeURIComponent(query)}`);
  return data.results;
}

export async function fetchMovieDetails(id: number) {
  return await get(`/movie/${id}`);
}

import express from 'express';

const router = express.Router();

// Get the API key from environment variables
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Search for movies
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not configured' });
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(
        query as string
      )}&api_key=${TMDB_API_KEY}&include_adult=false&language=en-US&page=1`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // We can map the results to only send what the frontend needs
    const movies = data.results.map((movie: any) => ({
      tmdbId: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      releaseDate: movie.release_date,
      overview: movie.overview,
    }));

    res.json({ results: movies });
  } catch (error) {
    console.error('Movie search error:', error);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

export default router;

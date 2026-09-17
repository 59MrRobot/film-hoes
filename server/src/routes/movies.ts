import express from 'express';

const router = express.Router();

// Get the API key from environment variables
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

router.get('/keywords', async (req, res) => {
  try {
    const { query } = req.query;
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not configured' });
    }
    if (!query) {
      return res.json([]);
    }
    
    const response = await fetch(`${TMDB_BASE_URL}/search/keyword?query=${encodeURIComponent(query as string)}&api_key=${TMDB_API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch keywords');
    
    const data = await response.json();
    res.json(data.results || []);
  } catch (error) {
    console.error('Error fetching keywords:', error);
    res.status(500).json({ error: 'Failed to fetch keywords' });
  }
});

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
    
    const searchResults = data.results.slice(0, 15);
    
    const movies = await Promise.all(searchResults.map(async (movie: any) => {
      let director = null;
      try {
        const creditsRes = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`);
        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          director = creditsData.crew?.find((member: any) => member.job === 'Director')?.name || null;
        }
      } catch (err) {
        // Ignore individual credit fetch errors to avoid breaking the whole search
      }

      return {
        tmdbId: movie.id,
        title: movie.title,
        posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        backdropUrl: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
        releaseDate: movie.release_date,
        overview: movie.overview,
        director,
      };
    }));

    res.json({ results: movies });
  } catch (error) {
    console.error('Movie search error:', error);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

// Get movie details including credits (director, cast)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not configured' });
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`,
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
    
    const director = data.credits?.crew?.find((member: any) => member.job === 'Director')?.name;
    const cast = data.credits?.cast?.slice(0, 10).map((member: any) => member.name) || [];

    const youtubeVideos = data.videos?.results?.filter((v: any) => v.site === 'YouTube') || [];
    const trailer = youtubeVideos.find((v: any) => v.type === 'Trailer') || youtubeVideos[0] || null;
    const trailerKey = trailer ? trailer.key : null;

    const movie = {
      tmdbId: data.id,
      title: data.title,
      posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
      releaseDate: data.release_date,
      overview: data.overview,
      director,
      cast,
      trailerKey
    };

    res.json(movie);
  } catch (error) {
    console.error('Movie details error:', error);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

export default router;

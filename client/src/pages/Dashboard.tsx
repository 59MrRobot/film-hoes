import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';
import { 
  AppBar, Toolbar, Typography, Button, Container, Grid, Card, CardMedia, 
  CardContent, CardActions, TextField, Box, Paper, List, ListItem, 
  ListItemAvatar, Avatar, ListItemText, Alert, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CustomButton from '../components/CustomButton';

interface Vote {
  id: number;
  userId: number;
  nominationId: number;
}

interface Nomination {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterUrl: string | null;
  user: {
    id: number;
    username: string;
  };
  votes: Vote[];
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const fetchNominations = async () => {
    try {
      const res = await api.get('/nominations');
      setNominations(res.data);
    } catch (err) {
      console.error('Failed to fetch nominations', err);
    }
  };

  useEffect(() => {
    fetchNominations();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError('');
    try {
      const res = await api.get(`/movies/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data.results);
    } catch (err) {
      setError('Failed to search movies');
    } finally {
      setIsSearching(false);
    }
  };

  const nominateMovie = async (movie: any) => {
    try {
      setError('');
      await api.post('/nominations', {
        tmdbMovieId: movie.tmdbId,
        title: movie.title,
        posterUrl: movie.posterUrl
      });
      setSearchResults([]);
      setSearchQuery('');
      fetchNominations();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to nominate movie');
    }
  };

  const castVote = async (nominationId: number) => {
    try {
      setError('');
      await api.post('/votes', { nominationId });
      fetchNominations(); // refresh votes
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cast vote');
    }
  };

  const sortedNominations = [...nominations].sort((a, b) => b.votes.length - a.votes.length);
  const top3 = sortedNominations.slice(0, 3);

  const hasUserVotedFor = (nomination: Nomination) => {
    return nomination.votes.some(v => v.userId === user?.id);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', pb: 8 }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Movie Club
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary' }}>
            Hi, {user?.username}
          </Typography>
          <CustomButton variant="outlined" color="inherit" onClick={logout} size="small" label="Sign out" />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Nominate Column */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }} elevation={2}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Nominate a Movie
              </Typography>
              
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search TMDB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <CustomButton 
                  type="submit" 
                  disabled={isSearching}
                  startIcon={<SearchIcon />}
                  label="Search"
                />
              </form>

              {searchResults.length > 0 && (
                <List sx={{ maxHeight: 400, overflow: 'auto', bgcolor: 'background.paper' }}>
                  {searchResults.map((movie) => (
                    <ListItem key={movie.tmdbId} alignItems="flex-start" divider>
                      <ListItemAvatar>
                        <Avatar 
                          variant="rounded" 
                          src={movie.posterUrl || ''} 
                          alt={movie.title}
                          sx={{ width: 50, height: 75, mr: 2 }}
                        >
                          {!movie.posterUrl && 'Img'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={movie.title}
                        secondary={movie.releaseDate?.substring(0, 4)}
                        primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 'bold' }}
                      />
                      <CustomButton 
                        size="small" 
                        variant="outlined" 
                        onClick={() => nominateMovie(movie)}
                        sx={{ mt: 1 }}
                        label="Nominate"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Current Nominations & Voting Column */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, minHeight: '100%' }} elevation={2}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                This Week's Nominations
              </Typography>
              
              {nominations.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No movies nominated yet for this week!
                </Typography>
              ) : (
                <Grid container spacing={3}>
                  {nominations.map((nom) => {
                    const isOwn = nom.user.id === user?.id;
                    const voted = hasUserVotedFor(nom);
                    const isTop3 = top3.some(t => t.id === nom.id) && nom.votes.length > 0;

                    return (
                      <Grid item xs={12} sm={6} md={4} key={nom.id}>
                        <Card 
                          elevation={isTop3 ? 8 : 1}
                          sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            border: isTop3 ? '2px solid #fbbf24' : 'none'
                          }}
                        >
                          <CardMedia
                            component="img"
                            height="240"
                            image={nom.posterUrl || ''}
                            alt={nom.title}
                            sx={{ bgcolor: 'grey.200', objectFit: 'cover' }}
                          />
                          <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                            <Typography gutterBottom variant="subtitle1" fontWeight="bold" noWrap title={nom.title}>
                              {nom.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Nominated by {nom.user.username}
                            </Typography>
                          </CardContent>
                          <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                            <Typography variant="body2" fontWeight="bold" color="text.secondary">
                              {nom.votes.length} votes
                            </Typography>
                            <CustomButton
                              variant={voted ? "contained" : "outlined"}
                              size="small"
                              disabled={isOwn}
                              onClick={() => castVote(nom.id)}
                              label={voted ? 'Voted ✓' : 'Vote'}
                            />
                          </CardActions>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

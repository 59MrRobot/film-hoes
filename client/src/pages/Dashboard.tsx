import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import api from "../api";
import { AppBar, Toolbar, Typography, Button, Container, Grid, TextField, Box, List, ListItem, ListItemAvatar, Avatar, ListItemText, Alert, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CustomButton from "../components/CustomButton";

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
  const navigate = useNavigate();
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  // When false, limit dropdown suggestions to 10 items
  const [showAll, setShowAll] = useState(false);

  const fetchNominations = async () => {
    try {
      const res = await api.get("/nominations");
      setNominations(res.data);
    } catch (err) {
      console.error("Failed to fetch nominations", err);
    }
  };

  useEffect(() => {
    fetchNominations();
  }, []);

  // Debounce search: automatically query after 5 seconds of inactivity
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError("");
      try {
        const res = await api.get(`/movies/search?query=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data.results);
      } catch (err) {
        setError("Failed to search movies");
      } finally {
        setIsSearching(false);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Retain manual search via button if needed
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // The debounce effect will handle searching; this ensures immediate search on button click
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError("");
    try {
      const res = await api.get(`/movies/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data.results);
    } catch (err) {
      setError("Failed to search movies");
    } finally {
      setIsSearching(false);
    }
  };
  const nominateMovie = async (movie: any) => {
    try {
      setError("");
      await api.post("/nominations", {
        tmdbMovieId: movie.tmdbId,
        title: movie.title,
        posterUrl: movie.posterUrl,
      });
      setSearchResults([]);
      setSearchQuery("");
      fetchNominations();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to nominate movie");
    }
  };

  const castVote = async (nominationId: number) => {
    try {
      setError("");
      await api.post("/votes", { nominationId });
      fetchNominations(); // refresh votes
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to cast vote");
    }
  };

  const sortedNominations = [...nominations].sort((a, b) => b.votes.length - a.votes.length);
  const top3 = sortedNominations.slice(0, 3);

  const hasUserVotedFor = (nomination: Nomination) => {
    return nomination.votes.some((v) => v.userId === user?.id);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  const totalVotesThisWeek = nominations.reduce((sum, nom) => sum + nom.votes.length, 0);

  const handleReplace = async (nominationId: number) => {
    try {
      setError("");
      await api.delete(`/nominations/${nominationId}`);
      navigate("/nominate");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to replace nomination");
    }
  };

  const handleCycleWeek = async () => {
    if (!window.confirm("Are you sure you want to end the current week? All current nominations and votes will be archived and a fresh week will begin!")) return;
    try {
      setError("");
      await api.post("/nominations/cycle-week");
      fetchNominations(); // Re-fetch, which will hit the empty new week
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to end the week");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 8 }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            Film Hoes
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, color: "text.secondary" }}>
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

        <Box sx={{ display: "flex", gap: 2, mb: 4, alignItems: "center" }}>
          <CustomButton variant="contained" label="Nominate a Movie" onClick={() => navigate("/nominate")} />
          {user?.id === 1 && (
            <Button variant="outlined" color="error" onClick={handleCycleWeek} sx={{ borderRadius: 2, fontWeight: "bold", textTransform: "none" }}>
              Admin: End Week
            </Button>
          )}
        </Box>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4, alignItems: "flex-start" }}>
          
          {/* Leaderboard Column (Left on Desktop, Top on Mobile) */}
          <Box sx={{ width: { xs: "100%", md: "33.333%" } }}>
            <Box sx={{ p: 3, bgcolor: "rgba(255,255,255,0.5)", borderRadius: 3, border: "1px solid", borderColor: "divider", height: "100%" }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                🏆 Top 3 Leaders
              </Typography>
              
              {top3.length === 0 || top3[0].votes.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2, fontStyle: "italic", fontSize: "0.9rem" }}>
                  No votes cast yet this week.
                </Typography>
              ) : (
                <List sx={{ p: 0, mt: 2 }}>
                  {top3.map((nom, index) => {
                    if (nom.votes.length === 0) return null; // Only show movies with actual votes
                    
                    return (
                      <ListItem key={`top3-${nom.id}`} sx={{ p: 0, mb: 2, display: "flex", alignItems: "center" }}>
                        <Typography variant="h5" fontWeight="bold" color="secondary.main" sx={{ width: 28, flexShrink: 0 }}>
                          {index + 1}
                        </Typography>
                        <Avatar variant="rounded" src={nom.posterUrl || ""} sx={{ width: 40, height: 60, mx: 1.5, boxShadow: 1 }} />
                        <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                          <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ lineHeight: 1.2 }}>
                            {nom.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {nom.votes.length} {nom.votes.length === 1 ? 'vote' : 'votes'}
                          </Typography>
                        </Box>
                      </ListItem>
                    )
                  })}
                </List>
              )}
            </Box>
          </Box>

          {/* Current Nominations & Voting Column (Right on Desktop, Bottom on Mobile) */}
          <Box sx={{ width: { xs: "100%", md: "66.666%" } }}>
            <Box sx={{ p: 0, minHeight: "100%" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ m: 0 }}>
                  This Week's Nominations
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: "bold", color: "text.secondary", textTransform: "uppercase", letterSpacing: 1, display: { xs: 'none', sm: 'block' } }}>
                    Weekly Votes
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {[...Array(2)].map((_, i) => {
                      const myVotesCount = nominations.flatMap((n) => n.votes).filter((v) => v.userId === user?.id).length;
                      const isAvailable = i < 2 - myVotesCount;
                      return (
                        <Box
                          key={i}
                          title={isAvailable ? "Available Vote" : "Used Vote"}
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            bgcolor: isAvailable ? "secondary.main" : "transparent",
                            boxShadow: isAvailable ? "0 0 8px rgba(212, 168, 67, 0.6)" : "none",
                            border: isAvailable ? "none" : "2px solid rgba(0,0,0,0.15)",
                            transition: "all 0.3s ease",
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              </Box>

              {nominations.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No movies nominated yet for this week!
                </Typography>
              ) : (
                <List sx={{ width: "100%", bgcolor: "transparent", p: 0 }}>
                  {nominations.map((nom) => {
                    const isOwn = nom.user.id === user?.id;
                    const voted = hasUserVotedFor(nom);
                    const isTop3 = top3.some((t) => t.id === nom.id) && nom.votes.length > 0;

                    return (
                      <ListItem
                        key={nom.id}
                        sx={{
                          mb: 2,
                          borderRadius: 2,
                          border: isTop3 ? "2px solid" : "1px solid",
                          borderColor: isTop3 ? "secondary.main" : "divider",
                          bgcolor: isTop3 ? "rgba(212, 168, 67, 0.05)" : "transparent",
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          alignItems: { xs: "flex-start", sm: "center" },
                          p: 2,
                          gap: { xs: 1, sm: 2 },
                        }}
                      >
                        {/* Movie Info */}
                        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1, width: "100%" }}>
                          <Avatar variant="rounded" src={nom.posterUrl || ""} alt={nom.title} sx={{ width: 60, height: 90, mr: 2, boxShadow: 1 }}>
                            {!nom.posterUrl && "Img"}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                              <RouterLink to={`/film/${nom.tmdbMovieId}-${generateSlug(nom.title)}`} style={{ textDecoration: "none", color: "inherit" }}>
                                {nom.title}
                              </RouterLink>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Nominated by <span style={{ fontWeight: "bold" }}>{nom.user.username}</span>
                            </Typography>
                          </Box>
                        </Box>

                        {/* Actions & Votes */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "row", sm: "column" },
                            alignItems: { xs: "center", sm: "flex-end" },
                            justifyContent: "space-between",
                            width: { xs: "100%", sm: "auto" },
                            mt: { xs: 1, sm: 0 },
                            pt: { xs: 1.5, sm: 0 },
                            borderTop: { xs: "1px solid", sm: "none" },
                            borderColor: "divider",
                            minWidth: 100,
                          }}
                        >
                          <Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ mb: { xs: 0, sm: 1 } }}>
                            {nom.votes.length} votes
                          </Typography>
                          {isOwn && totalVotesThisWeek === 0 ? (
                            <CustomButton variant="outlined" color="primary" size="small" onClick={() => handleReplace(nom.id)} label="Replace" />
                          ) : (
                            <CustomButton variant={voted ? "contained" : "outlined"} size="small" disabled={isOwn} onClick={() => castVote(nom.id)} label={voted ? "Voted ✓" : "Vote"} />
                          )}
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

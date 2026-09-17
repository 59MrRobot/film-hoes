import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import api from "../api";
import {
  AppBar,
  Toolbar,
  Button,
  Grid,
  Box,
  Typography,
  Avatar,
  Container,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  DialogContentText,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LocalMoviesIcon from "@mui/icons-material/LocalMovies";
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
  const [latestWeek, setLatestWeek] = useState<any>(null);
  const [nominations, setNominations] = useState<Nomination[]>([]);

  // User Management State
  const [manageUsersDialogOpen, setManageUsersDialogOpen] = useState(false);
  const [usersList, setUsersList] = useState<{ id: number; username: string; isAdmin: boolean }[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  // Keyword Search State
  const [startWeekDialogOpen, setStartWeekDialogOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<{ id: number; name: string } | null>(null);
  const [keywordQuery, setKeywordQuery] = useState("");
  const [keywordOptions, setKeywordOptions] = useState<{ id: number; name: string }[]>([]);
  const [isSearchingKeywords, setIsSearchingKeywords] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  // When false, limit dropdown suggestions to 10 items
  const [showAll, setShowAll] = useState(false);

  const fetchData = async () => {
    try {
      const latestRes = await api.get("/nominations/latest");
      if (latestRes.data) {
        setLatestWeek(latestRes.data);
        setNominations(latestRes.data.nominations || []);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    }
  };

  // Debounce keyword search
  useEffect(() => {
    if (!keywordQuery.trim()) {
      setKeywordOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingKeywords(true);
      try {
        const res = await api.get(`/movies/keywords?query=${encodeURIComponent(keywordQuery)}`);
        setKeywordOptions(res.data);
      } catch (err) {
        console.error("Failed to fetch keywords", err);
      } finally {
        setIsSearchingKeywords(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [keywordQuery]);

  useEffect(() => {
    fetchData();
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
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to nominate movie");
    }
  };

  const castVote = async (nominationId: number) => {
    try {
      setError("");
      await api.post("/votes", { nominationId });
      fetchData(); // refresh votes
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

  const handleEndWeek = async () => {
    if (!window.confirm("Are you sure you want to end the current week? Nominations and votes will be closed.")) return;

    try {
      await api.post("/nominations/end-week");
      fetchData();
    } catch (err) {
      console.error("Failed to end week", err);
      setError("Failed to end the week");
    }
  };

  const handleStartWeek = async () => {
    if (!selectedTheme) {
      setError("Please select a theme to start the new week");
      return;
    }

    try {
      await api.post("/nominations/start-week", { theme: selectedTheme.name });
      setStartWeekDialogOpen(false);
      setSelectedTheme(null);
      setKeywordQuery("");
      fetchData();
    } catch (err) {
      console.error("Failed to start week", err);
      setError("Failed to start the new week");
    }
  };

  const handleOpenManageUsers = async () => {
    setManageUsersDialogOpen(true);
    setIsFetchingUsers(true);
    try {
      const res = await api.get("/users");
      setUsersList(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const handleToggleAdmin = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await api.put(`/users/${userId}/role`, { isAdmin: !currentStatus });
      setUsersList(usersList.map((u) => (u.id === userId ? { ...u, isAdmin: res.data.isAdmin } : u)));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update user role");
    }
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const nominationsListContent =
    nominations.length === 0 ? (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        No movies nominated yet for this week!
      </Typography>
    ) : (
      <List
        sx={{
          width: "100%",
          bgcolor: "transparent",
          p: 0,
          maxHeight: { xs: "600px", sm: "420px", md: "560px" },
          overflowY: "auto",
          pr: 1, // padding for the scrollbar
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            bgcolor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "rgba(0,0,0,0.2)",
            borderRadius: "10px",
          },
        }}
      >
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
                bgcolor: isTop3 ? "rgba(212, 168, 67, 0.05)" : "rgba(255,255,255,0.4)",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                p: 2,
                gap: { xs: 1, sm: 2 },
                transition: "all 0.2s",
                "&:hover": {
                  transform: "translateX(4px)",
                  bgcolor: isTop3 ? "rgba(212, 168, 67, 0.08)" : "rgba(255,255,255,0.8)",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                },
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
                  <CustomButton variant="outlined" color="primary" size="small" disabled={!latestWeek?.isActive} onClick={() => handleReplace(nom.id)} label="Replace" />
                ) : (
                  <CustomButton variant={voted ? "contained" : "outlined"} size="small" disabled={isOwn || !latestWeek?.isActive} onClick={() => castVote(nom.id)} label={voted ? "Voted ✓" : "Vote"} />
                )}
              </Box>
            </ListItem>
          );
        })}
      </List>
    );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 8, position: "relative" }}>
      {/* Subtle theater vignette */}
      <Box sx={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(circle, rgba(0,0,0,0) 50%, rgba(0,0,0,0.06) 100%)", zIndex: 0 }} />

      {/* Cinematic Leader/Winner Backdrop */}
      {top3.length > 0 && top3[0].backdropUrl && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "70vh", // Covers the top half of the screen
            backgroundImage: `url(${top3[0].backdropUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center 15%",
            opacity: 0.15, // Extremely subtle so it's "lowkey"
            zIndex: 0,
            pointerEvents: "none",
            // Smoothly fade it out into the background color at the bottom
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
          }}
        />
      )}

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: "rgba(232, 221, 204, 0.6)", backdropFilter: "blur(12px)", color: "text.primary", borderBottom: "1px solid rgba(255,255,255,0.3)", boxShadow: "0 4px 30px rgba(0,0,0,0.03)" }}>
          <Container maxWidth="xl">
            <Toolbar disableGutters>
              {/* Logo / Branding */}
              <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1, gap: 1 }}>
                <LocalMoviesIcon sx={{ color: "primary.main", fontSize: 28 }} />
                <Typography variant="h6" component="div" sx={{ fontWeight: "bold", fontFamily: "'ITC Fenice Bold', serif", letterSpacing: 0.5 }}>
                  Film Hoes
                </Typography>
              </Box>

              {/* User Profile Chip */}
              <Box
                onClick={handleMenu}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  bgcolor: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.8)",
                  borderRadius: 50,
                  py: 0.5,
                  pl: 2,
                  pr: 0.5,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.8)", transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
                }}
              >
                <Typography variant="body2" fontWeight="bold" sx={{ color: "text.primary" }}>
                  Hi, {user?.username}
                </Typography>
                <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: "1rem", boxShadow: 1 }}>{user?.username?.[0]?.toUpperCase()}</Avatar>
              </Box>

              <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{ paper: { sx: { mt: 1, minWidth: 120 } } }}
            >
              <MenuItem
                onClick={() => {
                  handleClose();
                  navigate("/profile");
                }}
              >
                Profile
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose();
                  navigate("/history");
                }}
              >
                Previous Weeks
              </MenuItem>
              {user?.isAdmin && (
                <MenuItem
                  onClick={() => {
                    handleClose();
                    handleOpenManageUsers();
                  }}
                >
                  Manage Users
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  handleClose();
                  logout();
                }}
                sx={{ color: "error.main" }}
              >
                Sign out
              </MenuItem>
            </Menu>
          </Toolbar>
          </Container>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight="bold" letterSpacing={2}>
                {/* {latestWeek?.isActive ? "This Week's Theme" : "Previous Week's Theme"} */}
                This Week's Theme
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {latestWeek?.theme ? `"${latestWeek.theme}"` : "Open Theme"}
              </Typography>
              {!latestWeek?.isActive && (
                <Typography variant="body2" color="error.main" sx={{ mt: 1, fontWeight: "bold" }}>
                  This week has ended. Start a new week to continue voting!
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2, mb: 4, alignItems: "center", flexWrap: "wrap" }}>
            {latestWeek?.isActive ? <CustomButton size="small" variant="contained" label="Nominate a Film" onClick={() => navigate("/nominate")} /> : null}

            {/* <CustomButton size="small" variant="outlined" color="primary" label="Previous Weeks" onClick={() => navigate("/history")} /> */}

            {user?.isAdmin && (
              <>
                {latestWeek?.isActive ? (
                  <CustomButton size="small" variant="outlined" color="error" onClick={handleEndWeek} label="Admin: End Week" />
                ) : (
                  <CustomButton size="small" variant="contained" color="secondary" onClick={() => setStartWeekDialogOpen(true)} label="Admin: Start New Week" />
                )}
              </>
            )}
          </Box>

          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: latestWeek?.isActive ? "row" : "column" }, gap: 4, alignItems: "flex-start" }}>
            {/* Leaderboard Column (Left on Desktop, Top on Mobile) */}
            <Box sx={{ width: { xs: "100%", md: latestWeek?.isActive ? "33.333%" : "100%" } }}>
              <Box sx={{ p: 3, bgcolor: "rgba(255,255,255,0.5)", borderRadius: 3, border: "1px solid", borderColor: "divider", height: "100%" }}>
                <Typography
                  variant={latestWeek?.isActive ? "h6" : "h4"}
                  fontWeight="bold"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", justifyContent: latestWeek?.isActive ? "flex-start" : "center", gap: 1, mb: latestWeek?.isActive ? 1 : 3 }}
                >
                  {latestWeek?.isActive ? "Top 3 Leaders" : "Final Leaderboard"}
                </Typography>

                {top3.length === 0 || top3[0].votes.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 2, fontStyle: "italic", fontSize: "0.9rem", textAlign: latestWeek?.isActive ? "left" : "center" }}>
                    No votes cast yet this week.
                  </Typography>
                ) : (
                <List sx={{ p: 0, mt: latestWeek?.isActive ? 2 : 6, display: latestWeek?.isActive ? "block" : "flex", flexDirection: { xs: "column", md: "row" }, gap: latestWeek?.isActive ? 0 : 3, justifyContent: "center", alignItems: "flex-end" }}>
                  {top3.map((nom, index) => {
                    if (nom.votes.length === 0) return null; // Only show movies with actual votes
                    const isEnded = !latestWeek?.isActive;
                    const order = index === 0 ? 2 : index === 1 ? 1 : 3;

                    return (
                      <ListItem
                        key={`top3-${nom.id}`}
                        sx={{
                          p: isEnded ? 3 : (index === 0 ? 1.5 : 1),
                          mb: latestWeek?.isActive ? 2 : 0,
                          display: "flex",
                          flexDirection: isEnded ? "column" : "row",
                          alignItems: "center",
                          order: isEnded ? { xs: index, md: order } : undefined, // Stack normally on mobile, podium on desktop
                          background: isEnded
                            ? (index === 0 ? "linear-gradient(135deg, rgba(212, 168, 67, 0.2) 0%, rgba(212, 168, 67, 0.05) 100%)"
                              : index === 1 ? "linear-gradient(135deg, rgba(192, 192, 192, 0.2) 0%, rgba(192, 192, 192, 0.02) 100%)"
                              : "linear-gradient(135deg, rgba(205, 127, 50, 0.2) 0%, rgba(205, 127, 50, 0.02) 100%)")
                            : (index === 0 ? "rgba(212, 168, 67, 0.1)" : "transparent"),
                          backdropFilter: isEnded ? "blur(10px)" : "none",
                          borderRadius: 3,
                          border: isEnded
                            ? `1px solid ${index === 0 ? "rgba(212, 168, 67, 0.5)" : index === 1 ? "rgba(192, 192, 192, 0.5)" : "rgba(205, 127, 50, 0.5)"}`
                            : (index === 0 ? "1px solid rgba(212, 168, 67, 0.4)" : "1px solid transparent"),
                          boxShadow: isEnded
                            ? (index === 0 ? "0 8px 32px rgba(212, 168, 67, 0.2)" : "0 4px 16px rgba(0,0,0,0.1)")
                            : "none",
                          position: "relative",
                          overflow: "visible",
                          transition: "all 0.3s",
                          width: latestWeek?.isActive ? "100%" : { xs: "100%", md: "30%" },
                          transform: isEnded && index === 0 ? { xs: "none", md: "translateY(-20px)" } : "none",
                          "&:hover": { 
                            bgcolor: isEnded ? undefined : (index === 0 ? "rgba(212, 168, 67, 0.15)" : "rgba(0,0,0,0.02)"),
                            transform: isEnded ? (index === 0 ? { xs: "translateY(-4px)", md: "translateY(-24px)" } : "translateY(-4px)") : undefined
                          }
                        }}
                      >
                        {/* Rank Badge */}
                        {!isEnded && index === 0 && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              px: 1,
                              py: 0.25,
                              bgcolor: "secondary.main",
                              color: "white",
                              borderRadius: "0 8px 0 8px",
                              fontSize: "0.6rem",
                              fontWeight: "bold",
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}
                          >
                            Current Leader
                          </Box>
                        )}
                        
                        {isEnded && (
                          <Box sx={{ position: "absolute", top: -12, bgcolor: index === 0 ? "#d4a843" : index === 1 ? "#a0a0a0" : "#cd7f32", color: "white", px: 2, py: 0.5, borderRadius: 4, fontWeight: "bold", fontSize: "0.75rem", textTransform: "uppercase", boxShadow: 2, zIndex: 1 }}>
                            {index === 0 ? "Winner" : index === 1 ? "2nd Place" : "3rd Place"}
                          </Box>
                        )}

                        {!isEnded && (
                          <Typography
                            variant={index === 0 ? "h4" : "h6"}
                            fontWeight="bold"
                            color={index === 0 ? "secondary.main" : "text.secondary"}
                            sx={{ width: index === 0 ? 36 : 28, flexShrink: 0, textAlign: "center" }}
                          >
                            {index + 1}
                          </Typography>
                        )}

                        <Avatar
                          variant="rounded"
                          src={nom.posterUrl || ""}
                          sx={{
                            width: isEnded ? (index === 0 ? 120 : 90) : (index === 0 ? 50 : 40),
                            height: isEnded ? (index === 0 ? 180 : 135) : (index === 0 ? 75 : 60),
                            mx: isEnded ? "auto" : 1.5,
                            mb: isEnded ? 2 : 0,
                            mt: isEnded ? 1 : 0,
                            boxShadow: isEnded ? 3 : (index === 0 ? "0 4px 10px rgba(212, 168, 67, 0.4)" : 1),
                          }}
                        />

                        <Box sx={{ flexGrow: 1, overflow: "hidden", textAlign: isEnded ? "center" : "left", width: "100%" }}>
                          <Typography variant={isEnded ? (index === 0 ? "h5" : "h6") : (index === 0 ? "subtitle1" : "subtitle2")} fontWeight="bold" sx={{ lineHeight: 1.2, mb: isEnded ? 1 : 0 }}>
                            {nom.title}
                          </Typography>
                          <Typography variant={isEnded ? "body2" : "caption"} color="text.secondary" sx={{ fontWeight: index === 0 ? "bold" : "normal" }}>
                            {nom.votes.length} {nom.votes.length === 1 ? "vote" : "votes"}
                          </Typography>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
                )}
              </Box>
            </Box>

            {/* Current Nominations & Voting Column (Right on Desktop, Bottom on Mobile) */}
            <Box sx={{ width: { xs: "100%", md: latestWeek?.isActive ? "66.666%" : "100%" } }}>
              {latestWeek?.isActive ? (
                <Box sx={{ p: 0, minHeight: "100%" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ m: 0 }}>
                      This Week's Nominations
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: "bold", color: "text.secondary", textTransform: "uppercase", letterSpacing: 1, display: { xs: "none", sm: "block" } }}>
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
                  {nominationsListContent}
                </Box>
              ) : (
                <Accordion sx={{ bgcolor: "rgba(255,255,255,0.5)", borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "none", "&:before": { display: "none" }, mt: 4 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" fontWeight="bold" color="text.secondary">
                      View All {nominations.length} Nominations
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <Box sx={{ p: 2, pt: 0 }}>{nominationsListContent}</Box>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          </Box>
        </Container>

        {/* Start New Week Dialog */}
        <Dialog open={startWeekDialogOpen} onClose={() => setStartWeekDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: "bold", fontFamily: "'ITC Fenice Bold', serif" }}>Start New Week</DialogTitle>
          <DialogContent sx={{ mt: 1, overflow: "visible" }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Search for a theme/keyword from TMDB's database.
            </Typography>
            <Autocomplete
              options={keywordOptions}
              getOptionLabel={(option) => option.name}
              value={selectedTheme}
              onChange={(event, newValue) => {
                setSelectedTheme(newValue);
              }}
              inputValue={keywordQuery}
              onInputChange={(event, newInputValue) => {
                setKeywordQuery(newInputValue);
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={isSearchingKeywords}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Theme"
                  variant="outlined"
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps?.input,
                      endAdornment: (
                        <>
                          {isSearchingKeywords ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.slotProps?.input?.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setStartWeekDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <CustomButton onClick={handleStartWeek} variant="contained" label="Start Week" />
          </DialogActions>
        </Dialog>

        {/* Manage Users Dialog */}
        <Dialog open={manageUsersDialogOpen} onClose={() => setManageUsersDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: "bold", fontFamily: "'ITC Fenice Bold', serif" }}>Manage Users</DialogTitle>
          <DialogContent sx={{ mt: 1 }}>
            <DialogContentText sx={{ mb: 3 }}>Toggle admin privileges for users. You cannot revoke your own admin rights.</DialogContentText>
            {isFetchingUsers ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {usersList.map((u) => (
                  <ListItem key={u.id} sx={{ mb: 1, border: "1px solid", borderColor: "divider", borderRadius: 2, display: "flex", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.9rem" }}>{u.username[0]?.toUpperCase()}</Avatar>
                      <Typography fontWeight="bold">{u.username}</Typography>
                    </Box>
                    <FormControlLabel
                      control={<Switch checked={u.isAdmin} onChange={() => handleToggleAdmin(u.id, u.isAdmin)} disabled={u.id === user?.id} color="secondary" />}
                      label={u.isAdmin ? "Admin" : "User"}
                      labelPlacement="start"
                      sx={{ m: 0 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <CustomButton onClick={() => setManageUsersDialogOpen(false)} variant="contained" label="Close" />
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

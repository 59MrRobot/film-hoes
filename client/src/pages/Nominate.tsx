import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import api from "../api";
import { Box, Typography, TextField, Alert, Link, List, ListItem, ListItemAvatar, Avatar, ListItemText, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAuth } from "../AuthContext";

import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store";
import { setSearchQuery, setSearchResults, setShowAll, clearSearch } from "../slices/nominateSlice";

export default function Nominate() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { searchQuery, searchResults, showAll } = useSelector((state: RootState) => state.nominate);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const [nominationCount, setNominationCount] = useState<number>(0);

  useEffect(() => {
    const fetchNominations = async () => {
      if (!user) return;
      try {
        const res = await api.get("/nominations");
        const myNominations = res.data.filter((n: any) => n.userId === user.id);
        setNominationCount(myNominations.length);
      } catch (_err) {
        console.error("Failed to fetch nominations count", _err);
      }
    };
    fetchNominations();
  }, [user]);

  // Debounce search: fire after 1.5 seconds of inactivity
  useEffect(() => {
    if (!searchQuery.trim()) {
      dispatch(setSearchResults([]));
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError("");
      try {
        const res = await api.get(`/movies/search?query=${encodeURIComponent(searchQuery)}`);
        dispatch(setSearchResults(res.data.results));
        dispatch(setShowAll(true));
      } catch (_err) {
        setError("Failed to search movies");
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, dispatch]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError("");
    try {
      const res = await api.get(`/movies/search?query=${encodeURIComponent(searchQuery)}`);
      dispatch(setSearchResults(res.data.results));
    } catch (_err) {
      setError("Failed to search movies");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Box sx={{ height: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column", p: { xs: 2, md: 4 } }}>
      <Box sx={{ p: 0, width: "100%", maxWidth: 1000, mx: "auto", display: "flex", flexDirection: "column", flexGrow: 1, overflow: "hidden" }}>
        <Box>
          <Link
            onClick={() => navigate("/")}
            sx={{ display: "flex", alignItems: "center", cursor: "pointer", mb: 2, color: "text.secondary", textDecoration: "none", transition: "color 0.2s", "&:hover": { color: "text.primary" } }}
          >
            <ArrowBackIcon fontSize="small" sx={{ mr: 0.5 }} />
            <span>{`Back to Dashboard`}</span>
          </Link>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", m: 0 }}>
              Nominate a Film
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: "bold", color: "text.secondary", textTransform: "uppercase", letterSpacing: 1, display: { xs: "none", sm: "block" } }}>
                Weekly Slots
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {[...Array(2)].map((_, i) => {
                  const isAvailable = i < 2 - nominationCount;
                  return (
                    <Box
                      key={i}
                      title={isAvailable ? "Available Nomination" : "Used Nomination"}
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
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSearch} style={{ marginBottom: "8px" }}>
            <TextField
              inputRef={inputRef}
              size="small"
              fullWidth
              placeholder="Find Film..."
              value={searchQuery}
              onChange={(e) => {
                dispatch(setSearchQuery(e.target.value));
                dispatch(setShowAll(false));
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      {searchQuery && (
                        <IconButton
                          onClick={() => {
                            dispatch(clearSearch());
                            inputRef.current?.focus();
                          }}
                          edge="end"
                          size="small"
                          aria-label="clear"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton type="submit" disabled={isSearching} edge="end" size="small" aria-label="search">
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </form>
        </Box>

        {/* Scrollable Results Area */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", mt: 2, pr: 1 }}>
          {searchResults.length > 0 ? (
            <List sx={{ bgcolor: "transparent" }}>
              {(showAll ? searchResults : searchResults.slice(0, 10)).map((movie) => (
                <ListItem key={movie.tmdbId} alignItems="flex-start" divider>
                  <ListItemAvatar>
                    <Avatar variant="rounded" src={movie.posterUrl || ""} alt={movie.title} sx={{ width: 50, height: 75, mr: 2 }}>
                      {!movie.posterUrl && "Img"}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <RouterLink to={`/film/${movie.tmdbId}-${generateSlug(movie.title)}`} style={{ textDecoration: "none", color: "inherit" }}>
                        {movie.title}
                      </RouterLink>
                    }
                    secondary={
                      <>
                        {movie.releaseDate?.substring(0, 4)}
                        {movie.director ? ` • Dir. ${movie.director}` : ""}
                      </>
                    }
                    slotProps={{
                      primary: {
                        variant: "subtitle2",
                        sx: { fontWeight: "bold" },
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            searchQuery.trim() &&
            !isSearching && (
              <Typography color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
                No results found or start typing to search.
              </Typography>
            )
          )}
        </Box>
      </Box>
    </Box>
  );
}

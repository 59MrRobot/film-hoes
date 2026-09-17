import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Container, Paper, Typography, CircularProgress, Alert, Link } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import api from "../api";
import CustomButton from "../components/CustomButton";
import { useAuth } from "../AuthContext";

export default function FilmDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nominating, setNominating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [maxNominationsReached, setMaxNominationsReached] = useState(false);
  const [error, setError] = useState("");

  const handleNominate = async () => {
    try {
      setNominating(true);
      setError("");
      await api.post("/nominations", {
        tmdbMovieId: movie.tmdbId,
        title: movie.title,
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to nominate movie");
    } finally {
      setNominating(false);
    }
  };

  useEffect(() => {
    const fetchMovie = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        // Extract the tmdbId from the start of the slug (e.g., "12345-dune")
        const tmdbId = slug.split("-")[0];
        
        if (tmdbId) {
          const detailsRes = await api.get(`/movies/${tmdbId}`);
          setMovie(detailsRes.data);
        } else {
          setError("Invalid movie ID.");
        }
      } catch (err) {
        setError("Failed to fetch movie details.");
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [slug]);

  useEffect(() => {
    const checkNominationStatus = async () => {
      if (!movie) return;
      try {
        const res = await api.get("/nominations");
        const nominations = res.data;
        
        // Check if the movie is already nominated
        const isNominated = nominations.some((n: any) => Number(n.tmdbMovieId) === Number(movie.tmdbId));
        if (isNominated) {
          setSuccess(true);
        }

        // Check if user is out of slots
        const myNominationsCount = nominations.filter((n: any) => n.userId === user?.id).length;
        if (myNominationsCount >= 2) {
          setMaxNominationsReached(true);
        }
      } catch (err) {
        console.error("Failed to check nomination status", err);
      }
    };
    checkNominationStatus();
  }, [movie, user]);

  if (loading) {
    return (
      <Box sx={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", bgcolor: "background.default" }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", position: "relative" }}>
      {movie?.backdropUrl && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "65vh",
            backgroundImage: `url(${movie.backdropUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            zIndex: 0,
            opacity: 0.5,
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
          }}
        />
      )}
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, pt: { xs: 8, md: 20 }, pb: 2 }}>
        <Link component="button" onClick={() => navigate(-1)} sx={{ display: "flex", alignItems: "center", mb: 3, cursor: "pointer", textDecoration: "none", color: "text.secondary", transition: "color 0.2s", "&:hover": { color: "text.primary" } }}>
          <ArrowBackIcon fontSize="small" sx={{ mr: 0.5 }} />
          <span>Back</span>
        </Link>

        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : movie ? (
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>
            <Box
              component="img"
              src={movie.posterUrl || ""}
              alt={movie.title}
              sx={{
                width: { xs: "50%", md: 220 },
                height: { xs: "auto", md: 330 },
                objectFit: "cover",
                borderRadius: 2,
                boxShadow: 8,
                bgcolor: "rgba(0,0,0,0.05)",
                alignSelf: { xs: "center", md: "flex-start" },
              }}
            />
            <Box sx={{ 
              flexGrow: 1, 
              display: "flex", 
              flexDirection: "column", 
              position: "relative",
              p: { xs: 2, md: 4 }, 
              borderRadius: 3,
              zIndex: 1,
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(250, 246, 240, 0.65)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                zIndex: -1,
                pointerEvents: "none"
              }
            }}>
              <Typography variant="h3" fontWeight="bold" fontFamily="'ITC Fenice Bold', serif" color="primary.main" gutterBottom sx={{ textShadow: "0px 1px 2px rgba(255,255,255,0.8)" }}>
                {movie.title}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : "Unknown Year"}
                {movie.director && (
                  <>
                    <span style={{ margin: "0 8px" }}>•</span>
                    Directed by <span style={{ color: "#7b1e2f", fontWeight: "bold" }}>{movie.director}</span>
                  </>
                )}
              </Typography>

              <Box sx={{ my: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                  Overview
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  {movie.overview || "No overview available for this movie."}
                </Typography>
              </Box>

              {movie.cast && movie.cast.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                    Cast
                  </Typography>
                  <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                    {movie.cast.join(", ")}
                  </Typography>
                </Box>
              )}

              {movie.trailerKey && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                    Trailer
                  </Typography>
                  <Box sx={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 2, overflow: "hidden", boxShadow: 2 }}>
                    <iframe
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                      src={`https://www.youtube-nocookie.com/embed/${movie.trailerKey}?rel=0`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Trailer"
                    />
                  </Box>
                </Box>
              )}

              <Box sx={{ mt: { xs: 4, md: "auto" }, pt: 2, position: "relative", zIndex: 2 }}>
                <CustomButton
                  variant="contained"
                  color={success ? "success" : maxNominationsReached ? "inherit" : "secondary"}
                  size="large"
                  label={nominating ? "Nominating..." : success ? "Nominated!" : maxNominationsReached ? "Limit Reached" : "Nominate Movie"}
                  onClick={handleNominate}
                  disabled={nominating || success || maxNominationsReached}
                  sx={{ 
                    width: { xs: "100%", sm: 250 }, 
                    py: 1.5, 
                    fontWeight: "bold", 
                    fontSize: "1.1rem",
                    "&.Mui-disabled": success ? {
                      bgcolor: "success.main",
                      color: "white"
                    } : undefined
                  }}
                />
              </Box>
            </Box>
          </Box>
        ) : null}
      </Container>
    </Box>
  );
}

import React, { useEffect, useState } from "react";
import { Box, Typography, Container, Link, Avatar, Grid, Chip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useNavigate } from "react-router-dom";
import api from "../api";

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

interface PastWeek {
  id: number;
  startDate: string;
  isActive: boolean;
  nominations: Nomination[];
}

export default function History() {
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState<PastWeek[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/nominations/history");
        // Ensure we strictly don't show the active week, and skip empty weeks (0 nominations)
        const filteredWeeks = res.data.filter((w: PastWeek) => !w.isActive && w.nominations && w.nominations.length > 0);
        setWeeks(filteredWeeks);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 8 }, position: "relative" }}>
      {/* Subtle theater vignette */}
      <Box sx={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(circle, rgba(0,0,0,0) 50%, rgba(0,0,0,0.06) 100%)", zIndex: 0 }} />

      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Link
          onClick={() => navigate("/")}
          sx={{ display: "flex", alignItems: "center", cursor: "pointer", mb: 4, color: "text.secondary", textDecoration: "none", transition: "color 0.2s", "&:hover": { color: "text.primary" } }}
        >
          <ArrowBackIcon fontSize="small" sx={{ mr: 0.5 }} />
          <span>Back to Dashboard</span>
        </Link>

        <Typography variant="h3" fontWeight="bold" color="primary.main" gutterBottom textAlign="center" sx={{ textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          Previous Weeks
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>
          An archive of past nominations and winners.
        </Typography>

        {loading ? (
          <Typography textAlign="center">Loading archives...</Typography>
        ) : weeks.length === 0 ? (
          <Typography textAlign="center" color="text.secondary" fontStyle="italic">
            The archives are empty. Check back when a week has ended!
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {weeks.map((week, index) => {
              // Sort nominations by votes
              const sortedNoms = [...week.nominations].sort((a, b) => b.votes.length - a.votes.length);
              const winner = sortedNoms.length > 0 ? sortedNoms[0] : null;
              const runnersUp = sortedNoms.slice(1, 4);

              return (
                <Box
                  key={week.id}
                  sx={{
                    position: "relative",
                    borderRadius: 4,
                    overflow: "hidden",
                    p: { xs: 2, md: 4 },
                    boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "white",
                  }}
                >
                  {/* Dynamic Backdrop */}
                  {winner && (winner.backdropUrl || winner.posterUrl) && (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url(${winner.backdropUrl || winner.posterUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        zIndex: 0,
                      }}
                    />
                  )}
                  {/* Dark Glass Overlay */}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      bgcolor: "rgba(0,0,0,0.75)",
                      backdropFilter: "blur(12px)",
                      zIndex: 1,
                    }}
                  />

                  <Box sx={{ position: "relative", zIndex: 2 }}>
                    <Box sx={{ mb: 3, borderBottom: "1px solid rgba(255,255,255,0.2)", pb: 1 }}>
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        Week of {new Date(week.startDate).toLocaleDateString()}
                        <Chip size="small" label={`Week #${weeks.length - index}`} sx={{ bgcolor: "secondary.main", color: "white", fontWeight: "bold" }} />
                      </Typography>
                      {week.theme && (
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "rgba(255,255,255,0.8)", mt: 0.5, fontStyle: "italic" }}>
                          Theme: "{week.theme}"
                        </Typography>
                      )}
                    </Box>

                    {winner && winner.votes.length > 0 ? (
                      <Grid container spacing={4}>
                        {/* Winner Showcase */}
                        <Grid item xs={12} md={5}>
                          <Box sx={{ position: "relative" }}>
                            <Box
                              sx={{
                                position: "absolute",
                                top: -12,
                                left: -12,
                                bgcolor: "secondary.main",
                                color: "white",
                                borderRadius: "50%",
                                width: 40,
                                height: 40,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: 3,
                                zIndex: 2,
                              }}
                            >
                              <EmojiEventsIcon />
                            </Box>
                            <Avatar
                              variant="rounded"
                              src={winner.posterUrl || ""}
                              sx={{ width: "100%", height: "auto", aspectRatio: "2/3", boxShadow: "0 8px 30px rgba(0,0,0,0.8)", borderRadius: 3, border: "2px solid", borderColor: "secondary.main" }}
                            />
                          </Box>
                        </Grid>

                        {/* Winner Details & Runners Up */}
                        <Grid item xs={12} md={7} sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <Box sx={{ mb: 4 }}>
                            <Typography variant="overline" color="secondary.main" sx={{ fontWeight: "bold", letterSpacing: 2 }}>
                              Winner
                            </Typography>
                            <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", lineHeight: 1.1, color: "white" }}>
                              {winner.title}
                            </Typography>
                            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)" }}>
                              Nominated by <strong>{winner.user.username}</strong> • {winner.votes.length} votes
                            </Typography>
                          </Box>

                          {runnersUp.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 1, mb: 1.5 }}>
                                Runners Up
                              </Typography>
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                {runnersUp.map((nom, i) => (
                                  <Box key={nom.id} sx={{ display: "flex", alignItems: "center", p: 1, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                                    <Avatar variant="rounded" src={nom.posterUrl || ""} sx={{ width: 30, height: 45, mr: 1.5 }} />
                                    <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                                      <Typography variant="body2" sx={{ fontWeight: "bold", color: "white" }} noWrap>
                                        {nom.title}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
                                        {nom.votes.length} votes
                                      </Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                    ) : (
                      <Typography fontStyle="italic" sx={{ color: "rgba(255,255,255,0.7)" }}>
                        No votes were cast this week.
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Container>
    </Box>
  );
}

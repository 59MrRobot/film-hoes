import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import { Box, TextField, Typography, Link, Paper, InputAdornment, IconButton } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CustomButton from "../components/CustomButton";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/login", { username, password });
      login(response.data.user, response.data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to login");
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault();

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/login.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />

      <Paper
        elevation={24}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 400,
          p: 5,
          borderRadius: 4,
          bgcolor: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
          <Typography variant="h4" component="h1" sx={{ fontFamily: "'ITC Fenice Bold', serif", color: "white", letterSpacing: 4 }}>
            Film Hoes
          </Typography>
        </Box>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {error && (
            <Box bgcolor="rgba(211, 47, 47, 0.8)" color="white" p={1.5} borderRadius={1} textAlign="center">
              <Typography variant="body2">{error}</Typography>
            </Box>
          )}

          <TextField
            label="Username"
            variant="filled"
            fullWidth
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            InputProps={{
              sx: { color: "white", bgcolor: "rgba(0,0,0,0.4)", "&:hover": { bgcolor: "rgba(0,0,0,0.5)" } },
            }}
            InputLabelProps={{ sx: { color: "rgba(255,255,255,0.7)" } }}
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            variant="filled"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: { color: 'white', bgcolor: 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' } }
            }}
            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
          />

          <CustomButton type="submit" size="large" label="Sign In" fullWidth />

          <Box textAlign="center">
            <Link component={RouterLink} to="/register" sx={{ color: "#90caf9", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
              Don't have an account? Register here.
            </Link>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

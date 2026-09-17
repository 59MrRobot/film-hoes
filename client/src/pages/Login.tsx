import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import { Box, TextField, Typography, Link, Paper, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CustomButton from "../components/CustomButton";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Forgot Password State
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1 = username, 2 = question
  const [resetUsername, setResetUsername] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

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

  const handleFetchSecurityQuestion = async () => {
    setForgotError("");
    try {
      const res = await api.get(`/auth/security-question/${resetUsername}`);
      setSecurityQuestion(res.data.question);
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || "User not found or no security question set.");
    }
  };

  const handleResetPassword = async () => {
    setForgotError("");
    try {
      const res = await api.post("/auth/reset-password", {
        username: resetUsername,
        securityAnswer,
        newPassword
      });
      setForgotSuccess(res.data.message || "Password reset successfully!");
      // Automatically close after a delay
      setTimeout(() => {
        setForgotDialogOpen(false);
        setForgotStep(1);
        setForgotSuccess("");
        setResetUsername("");
        setSecurityAnswer("");
        setNewPassword("");
      }, 3000);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || "Failed to reset password.");
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
        minHeight: "100vh",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/login.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        p: 2,
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
            <Box
              sx={{
                bgcolor: "rgba(211, 47, 47, 0.8)",
                color: "white",
                p: 1.5,
                borderRadius: 1,
                textAlign: "center",
              }}
            >
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
            slotProps={{
              input: {
                sx: { 
                  bgcolor: "white", 
                  "&:hover": { bgcolor: "#f5f5f5" },
                  "&.Mui-focused": { bgcolor: "white" }
                },
              }
            }}
          />

          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            variant="filled"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { 
                  bgcolor: "white", 
                  "&:hover": { bgcolor: "#f5f5f5" },
                  "&.Mui-focused": { bgcolor: "white" }
                },
              }
            }}
          />

          <CustomButton type="submit" size="large" label="Sign In" fullWidth />

          <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 1 }}>
            <Link component="button" type="button" variant="body2" onClick={() => { setForgotDialogOpen(true); setForgotStep(1); setForgotError(""); setForgotSuccess(""); }} sx={{ color: "text.secondary", textDecoration: "none", "&:hover": { textDecoration: "underline", color: "white" } }}>
              Forgot Password?
            </Link>
            <Link component={RouterLink} to="/register" sx={{ color: "secondary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
              Don't have an account? Register here.
            </Link>
          </Box>
        </form>
      </Paper>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotDialogOpen} onClose={() => setForgotDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", fontFamily: "'ITC Fenice Bold', serif" }}>Reset Password</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          {forgotSuccess ? (
            <Box
              sx={{
                bgcolor: "rgba(46, 125, 50, 0.1)",
                color: "success.main",
                p: 2,
                borderRadius: 2,
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontWeight: "bold" }}>{forgotSuccess}</Typography>
            </Box>
          ) : (
            <>
              {forgotError && (
                <Box
                  sx={{
                    bgcolor: "rgba(211, 47, 47, 0.1)",
                    color: "error.main",
                    p: 2,
                    borderRadius: 2,
                    mb: 2,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body2">{forgotError}</Typography>
                </Box>
              )}
              
              {forgotStep === 1 ? (
                <>
                  <DialogContentText sx={{ mb: 3 }}>
                    Enter your username to retrieve your security question.
                  </DialogContentText>
                  <TextField
                    label="Username"
                    fullWidth
                    variant="outlined"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                  />
                </>
              ) : (
                <>
                  <DialogContentText sx={{ mb: 3, fontWeight: "bold", color: "text.primary" }}>
                    Security Question: {securityQuestion}
                  </DialogContentText>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                      label="Your Answer"
                      fullWidth
                      variant="outlined"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                    />
                    <TextField
                      label="New Password"
                      type="password"
                      fullWidth
                      variant="outlined"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>
        {!forgotSuccess && (
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setForgotDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            {forgotStep === 1 ? (
              <CustomButton onClick={handleFetchSecurityQuestion} variant="contained" label="Next" />
            ) : (
              <CustomButton onClick={handleResetPassword} variant="contained" label="Reset Password" />
            )}
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}

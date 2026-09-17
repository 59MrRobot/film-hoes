import React, { useState } from "react";
import { Box, Typography, TextField, Alert, Container, Link } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api from "../api";
import CustomButton from "../components/CustomButton";

export default function Profile() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  
  const [username, setUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      return setError("New passwords do not match.");
    }
    if (newPassword && !currentPassword) {
      return setError("Current password is required to set a new password.");
    }

    try {
      setLoading(true);
      const res = await api.put("/auth/profile", {
        username: username !== user?.username ? username : undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
        securityQuestion: securityQuestion || undefined,
        securityAnswer: securityAnswer || undefined,
      });

      // Update auth context with new token & user data
      const { token, user: updatedUser } = res.data;
      // We can reuse the login method to set the new token/user in context
      login(updatedUser, token);

      setSuccess("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="sm">
        
        <Link onClick={() => navigate("/")} sx={{ display: "flex", alignItems: "center", cursor: "pointer", mb: 3, color: "text.secondary", textDecoration: "none", transition: "color 0.2s", "&:hover": { color: "text.primary" } }}>
          <ArrowBackIcon fontSize="small" sx={{ mr: 0.5 }} />
          <span>Back to Dashboard</span>
        </Link>

        <Box sx={{ p: 4, bgcolor: "rgba(255,255,255,0.7)", borderRadius: 4, boxShadow: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom textAlign="center" color="primary.main">
            Update Profile
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <form onSubmit={handleUpdate}>
            <TextField
              label="Username"
              variant="filled"
              fullWidth
              margin="normal"
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

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, color: "text.secondary", fontWeight: "bold" }}>
              Change Password (Optional)
            </Typography>

            <TextField
              label="Current Password"
              type="password"
              variant="filled"
              fullWidth
              margin="normal"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
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
              label="New Password"
              type="password"
              variant="filled"
              fullWidth
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              label="Confirm New Password"
              type="password"
              variant="filled"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, color: "text.secondary", fontWeight: "bold" }}>
              Update Security Question (Optional)
            </Typography>

            <TextField
              label="Security Question (e.g. Favorite Movie?)"
              variant="filled"
              fullWidth
              margin="normal"
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
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
              label="Security Answer"
              variant="filled"
              fullWidth
              margin="normal"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
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

            <Box sx={{ mt: 4 }}>
              <CustomButton type="submit" size="large" label={loading ? "Updating..." : "Save Changes"} disabled={loading} fullWidth />
            </Box>
          </form>
        </Box>
      </Container>
    </Box>
  );
}

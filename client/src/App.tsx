import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

const theme = createTheme({
  typography: {
    fontFamily: '"ITC Fenice", "Times New Roman", Times, serif',
    h1: { fontFamily: '"ITC Fenice Bold", "Times New Roman", Times, serif' },
    h2: { fontFamily: '"ITC Fenice Bold", "Times New Roman", Times, serif' },
    h3: { fontFamily: '"ITC Fenice Bold", "Times New Roman", Times, serif' },
    h4: { fontFamily: '"ITC Fenice Bold", "Times New Roman", Times, serif' },
    h5: { fontFamily: '"ITC Fenice Bold", "Times New Roman", Times, serif' },
    h6: { fontFamily: '"ITC Fenice Bold", "Times New Roman", Times, serif' },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

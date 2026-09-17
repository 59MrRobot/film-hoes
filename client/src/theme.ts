import { createTheme } from "@mui/material";

// ==========================================
// CENTRAL THEME CONFIGURATION (Option A: Classic Cinema)
// Change your app colors here!
// ==========================================
const colors = {
  primary: "#7b1e2f",     /* Deep Burgundy / Theater Curtains */
  secondary: "#d4a843",   /* Rich Gold / Movie Stars */
  background: "#faf6f0",  /* Soft Cream / Off-White */
  paper: "#ffffff",       /* Pure White for cards */
  textMain: "#1c1c1c",   /* Dark Charcoal */
  textSecondary: "#5a5a5a" /* Medium Gray */
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary,
    },
    secondary: {
      main: colors.secondary,
    },
    background: {
      default: colors.background,
      paper: colors.paper,
    },
    text: {
      primary: colors.textMain,
      secondary: colors.textSecondary,
    },
  },
  typography: {
    fontFamily: '"ITC Fenice", "Times New Roman", Times, serif',
    h1: { fontFamily: '"ITC Fenice Bold", "Times New Roman", Times, serif' },
    h2: { fontFamily: '"ITC Fenice Bold", "Times New Roman", Times, serif' },
    h3: { fontFamily: '"ITC Fenice Bold", "Times New Roman", Times, serif' },
    h4: { fontFamily: '"ITC Fenice Bold", "Times New Roman", Times, serif' },
    h5: { fontFamily: '"ITC Fenice Bold", "Times New Roman", Times, serif' },
    h6: { fontFamily: '"ITC Fenice Bold", "Times New Roman", Times, serif' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          // You can add global button styling here if needed
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: colors.textMain,
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        underline: {
          '&:before': {
            borderBottomColor: colors.textMain,
          },
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        underline: {
          '&:before': {
            borderBottomColor: colors.textMain,
          },
        },
      },
    },
  }
});

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ darkMode: true, toggleDarkMode: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => { localStorage.setItem('darkMode', String(darkMode)); }, [darkMode]);

  const theme = useMemo(() => createTheme({
    palette: {
      mode: 'dark',
      primary: { main: '#4d90fe', light: '#80b0ff', dark: '#1a5cb8' },
      secondary: { main: '#ffc400', light: '#ffd740', dark: '#c79100' },
      background: { default: '#070b14', paper: '#0e1526' },
      text: { primary: '#e8eaf6', secondary: 'rgba(232,234,246,0.55)' },
      divider: 'rgba(255,255,255,0.07)',
      success: { main: '#4caf50' },
      warning: { main: '#ff9800' },
      error: { main: '#f44336' },
    },
    typography: {
      fontFamily: '"Inter", "Space Grotesk", "Helvetica", sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.03em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      caption: { letterSpacing: '0.08em', textTransform: 'uppercase' as const, fontSize: '0.65rem' },
    },
    shape: { borderRadius: 14 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none' as const,
            fontWeight: 600,
            minHeight: 44,
            fontSize: '0.9rem',
            backdropFilter: 'blur(10px)',
          },
          contained: {
            background: 'linear-gradient(135deg, #1a5cb8 0%, #4d90fe 100%)',
            boxShadow: '0 4px 20px rgba(77,144,254,0.3)',
            '&:hover': { boxShadow: '0 6px 25px rgba(77,144,254,0.45)' },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            background: 'rgba(255, 255, 255, 0.035)',
            backdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
              '&.Mui-focused fieldset': { borderColor: '#4d90fe' },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 600, fontSize: '0.72rem' },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 4, background: 'rgba(255,255,255,0.08)' },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            background: 'rgba(14, 21, 38, 0.95)',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: 'rgba(7, 11, 20, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'none',
          },
        },
      },
    },
  }), [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode: () => setDarkMode(d => !d) }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useThemeMode = () => useContext(ThemeContext);


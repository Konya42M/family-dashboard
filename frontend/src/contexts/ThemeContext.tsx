import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ darkMode: true, toggleDarkMode: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => { localStorage.setItem('darkMode', String(darkMode)); }, [darkMode]);

  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#1565c0', light: '#5e92f3', dark: '#003c8f' },
      secondary: { main: '#ad1457', light: '#e35183', dark: '#78002e' },
      background: darkMode
        ? { default: '#0a0e1a', paper: '#131929' }
        : { default: '#f0f4f8', paper: '#ffffff' },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 12, textTransform: 'none', fontWeight: 600, minHeight: 48, fontSize: '1rem' }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 20, backdropFilter: 'blur(10px)' }
        }
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 8 } }
      }
    }
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

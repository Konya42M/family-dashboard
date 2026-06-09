import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, alpha } from '@mui/material';

interface ThemeContextType { darkMode: boolean; toggleDarkMode: () => void; }
const ThemeContext = createContext<ThemeContextType>({ darkMode: true, toggleDarkMode: () => {} });

const DARK = {
  bg:       '#0d0f18',
  surface:  '#151824',
  surface2: '#1c2030',
  border:   'rgba(255,255,255,0.07)',
  text:     '#eef0f7',
  muted:    '#6b7280',
};
const LIGHT = {
  bg:       '#f4f6fc',
  surface:  '#ffffff',
  surface2: '#eef1f9',
  border:   'rgba(0,0,0,0.08)',
  text:     '#111827',
  muted:    '#6b7280',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light');
  useEffect(() => { localStorage.setItem('theme', dark ? 'dark' : 'light'); }, [dark]);

  const c = dark ? DARK : LIGHT;

  const theme = useMemo(() => createTheme({
    palette: {
      mode: dark ? 'dark' : 'light',
      primary:    { main: '#5b8dee', light: '#7ba7f5', dark: '#3a6dd8', contrastText: '#fff' },
      secondary:  { main: '#f5a623', light: '#f7c05a', dark: '#d48a14', contrastText: '#fff' },
      success:    { main: '#3ecf8e', contrastText: '#fff' },
      warning:    { main: '#f5a623', contrastText: '#fff' },
      error:      { main: '#f56565', contrastText: '#fff' },
      info:       { main: '#5b8dee', contrastText: '#fff' },
      background: { default: c.bg, paper: c.surface },
      text:       { primary: c.text, secondary: c.muted },
      divider:    c.border,
    },
    typography: {
      fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif',
      h1: { fontWeight: 800 }, h2: { fontWeight: 800 }, h3: { fontWeight: 700 },
      h4: { fontWeight: 700 }, h5: { fontWeight: 700 }, h6: { fontWeight: 600 },
      caption: { letterSpacing: '0.07em', fontSize: '0.62rem', fontWeight: 700 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: { styleOverrides: { body: { backgroundColor: c.bg, color: c.text } } },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 10, textTransform: 'none' as const, fontWeight: 700, minHeight: 44, fontFamily: 'inherit' },
          contained: { boxShadow: 'none', '&:hover': { boxShadow: '0 4px 16px rgba(91,141,238,0.35)' } },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 16, background: c.surface, border: `1px solid ${c.border}`, boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.06)' },
        },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              '& fieldset': { borderColor: c.border },
              '&:hover fieldset': { borderColor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' },
            },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 700, fontSize: '0.68rem', fontFamily: 'inherit' } } },
      MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)' } } },
      MuiAppBar: {
        styleOverrides: { root: { background: dark ? '#0d0f18' : '#fff', borderBottom: `1px solid ${c.border}`, boxShadow: 'none' } },
      },
      MuiDialog: {
        styleOverrides: { paper: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: 20 } },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { background: c.surface2, color: c.text, border: `1px solid ${c.border}`, fontSize: '0.75rem', fontFamily: 'inherit', fontWeight: 600, borderRadius: 8 } },
      },
    },
  }), [dark]);

  return (
    <ThemeContext.Provider value={{ darkMode: dark, toggleDarkMode: () => setDark(d => !d) }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useThemeMode = () => useContext(ThemeContext);


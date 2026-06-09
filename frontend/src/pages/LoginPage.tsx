import { useState } from 'react';
import { Box, TextField, Button, Typography, Stack, Alert, CircularProgress, useTheme } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useThemeMode } from '../contexts/ThemeContext';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import IconButton from '@mui/material/IconButton';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { darkMode, toggleDarkMode } = useThemeMode();
  const dark = theme.palette.mode === 'dark';

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); navigate('/'); }
    catch (err: any) { setError(err.response?.data?.error || 'Anmeldung fehlgeschlagen'); }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.palette.background.default, p: 2, position: 'relative' }}>
      {/* Theme toggle top right */}
      <IconButton onClick={toggleDarkMode} sx={{ position: 'absolute', top: 16, right: 16, color: 'text.secondary' }}>
        {dark ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
      </IconButton>

      <Box sx={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <Stack alignItems="center" spacing={1.5} mb={4}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '18px',
            background: 'linear-gradient(135deg, #5b8dee, #3a6dd8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(91,141,238,0.35)',
          }}>
            <HomeRoundedIcon sx={{ fontSize: 32, color: '#fff' }} />
          </Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em">FamilyHub</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Dein digitales Familien-Dashboard
          </Typography>
        </Stack>

        {/* Login form */}
        <Box sx={{
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '20px',
          p: 3,
          boxShadow: dark ? '0 8px 40px rgba(0,0,0,0.35)' : '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          <Typography variant="h6" fontWeight={700} mb={2.5}>Anmelden</Typography>
          <form onSubmit={doLogin}>
            <Stack spacing={2}>
              {error && <Alert severity="error" sx={{ borderRadius: 2, py: 0.5 }}>{error}</Alert>}
              <TextField
                label="E-Mail Adresse"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                fullWidth
                size="small"
                autoComplete="email"
                inputProps={{ style: { fontFamily: 'inherit' } }}
              />
              <TextField
                label="Passwort"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                fullWidth
                size="small"
                autoComplete="current-password"
                inputProps={{ style: { fontFamily: 'inherit' } }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || !email || !password}
                sx={{ py: 1.4, borderRadius: 2.5, mt: 0.5 }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Anmelden'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Zugänge:</Typography>
            <Typography variant="caption" color="text.secondary" display="block">Eltern: papa@familie.local / family123</Typography>
            <Typography variant="caption" color="text.secondary" display="block">Kinder: yusuf@familie.local / kind123</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}


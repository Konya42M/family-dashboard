import { useState } from 'react';
import { Box, TextField, Button, Typography, Stack, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DEMO_USERS = [
  { label: 'Papa', email: 'papa@familie.local', pw: 'family123' },
  { label: 'Mama', email: 'mama@familie.local', pw: 'family123' },
  { label: 'Yusuf', email: 'yusuf@familie.local', pw: 'kind123' },
  { label: 'Aysha', email: 'aysha@familie.local', pw: 'kind123' },
];

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (userEmail: string, userPw: string) => {
    setError('');
    setLoading(true);
    try {
      await login(userEmail, userPw);
      navigate('/');
    } catch {
      setError('Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(21,80,180,0.15) 0%, transparent 60%), #070b14',
      p: 2,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative orbs */}
      <Box sx={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(77,144,254,0.08) 0%, transparent 70%)', top: -100, left: -100, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,196,0,0.06) 0%, transparent 70%)', bottom: -50, right: -50, pointerEvents: 'none' }} />

      <Box sx={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {/* Header */}
        <Stack alignItems="center" spacing={1.5} mb={4}>
          <Box sx={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, rgba(77,144,254,0.2), rgba(26,92,184,0.4))',
            border: '1px solid rgba(77,144,254,0.4)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(77,144,254,0.2), 0 0 60px rgba(77,144,254,0.05)',
            fontSize: '2rem',
          }}>
            🏠
          </Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em" textAlign="center">
            Familien-Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Willkommen zurück
          </Typography>
        </Stack>

        {/* Quick-Login Buttons */}
        <Box sx={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 3,
          p: 2,
          mb: 2.5,
        }}>
          <Typography variant="caption" color="text.secondary" mb={1.5} display="block">
            Schnellanmeldung
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            {DEMO_USERS.map(u => (
              <Button
                key={u.email}
                onClick={() => quickLogin(u.email, u.pw)}
                disabled={loading}
                sx={{
                  py: 1.5,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  color: 'text.primary',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  '&:hover': { background: 'rgba(77,144,254,0.15)', borderColor: 'rgba(77,144,254,0.4)' },
                }}
              >
                {u.label}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Divider */}
        <Stack direction="row" alignItems="center" spacing={2} mb={2.5}>
          <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
          <Typography variant="caption" color="text.secondary">oder manuell</Typography>
          <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
        </Stack>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2, py: 0.5 }}>{error}</Alert>
            )}
            <TextField
              label="E-Mail"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
              size="small"
              autoComplete="email"
            />
            <TextField
              label="Passwort"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              size="small"
              autoComplete="current-password"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !email || !password}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Anmelden'}
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}


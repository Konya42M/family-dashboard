import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Stack, Alert, CircularProgress } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0e1a 0%, #131929 100%)', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack alignItems="center" spacing={2} mb={4}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #1565c0, #0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HomeIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} textAlign="center">Familien-Dashboard</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">Melde dich an</Typography>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
              <TextField
                label="E-Mail"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                fullWidth
                required
                autoComplete="email"
                InputProps={{ sx: { borderRadius: 3 } }}
              />
              <TextField
                label="Passwort"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                fullWidth
                required
                autoComplete="current-password"
                InputProps={{ sx: { borderRadius: 3 } }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ py: 1.5, borderRadius: 3, fontSize: '1rem', fontWeight: 700, mt: 1 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Anmelden'}
              </Button>
            </Stack>
          </form>

          <Box mt={3} sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', pt: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">Demo-Zugänge:</Typography>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">papa@familie.local / family123</Typography>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">yusuf@familie.local / kind123</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

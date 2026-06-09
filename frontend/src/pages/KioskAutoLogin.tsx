import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import api from '../api/client';

// Diese Seite wird auf dem Pi-Display aufgerufen.
// Sie loggt sich automatisch per Kiosk-Endpoint ein und leitet zum Dashboard weiter.
// Auf Handys schlägt dieser Endpoint fehl (nur localhost) → normale Login-Seite.
export function KioskAutoLogin() {
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    api.post('/auth/kiosk', {})
      .then(res => {
        localStorage.setItem('token', res.data.token);
        // Seite neu laden damit AuthContext den Token aufnimmt
        window.location.replace('/');
      })
      .catch(() => {
        // Kiosk-Login nicht erlaubt (nicht localhost) → normaler Login
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d0f18', gap: 2 }}>
      <Typography sx={{ fontSize: '3rem' }}>🏠</Typography>
      <CircularProgress size={32} sx={{ color: '#5b8dee' }} />
      <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
        FamilyHub startet…
      </Typography>
    </Box>
  );
}


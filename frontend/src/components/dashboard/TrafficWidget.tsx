import { useState, useEffect } from 'react';
import { Box, Typography, Stack, Chip, CircularProgress } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import WarningIcon from '@mui/icons-material/Warning';
import api from '../../api/client';
import { TrafficInfo } from '../../types';
import { useInterval } from '../../hooks/useInterval';

interface TrafficData { dad: TrafficInfo | null; mom: TrafficInfo | null; error?: string; }

const statusColor = { green: '#4caf50', yellow: '#ff9800', red: '#f44336' };
const statusLabel = { green: 'Freie Fahrt', yellow: 'Leichter Stau', red: 'Stau' };

function TrafficCard({ label, data }: { label: string; data: TrafficInfo | null }) {
  if (!data) return null;
  if (data.error) return (
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" color="error.main">{data.error}</Typography>
    </Box>
  );
  const color = statusColor[data.status || 'green'];
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, border: `2px solid ${color}33`, bgcolor: `${color}11` }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>{label}</Typography>
        <Chip size="small" label={statusLabel[data.status || 'green']} sx={{ bgcolor: color, color: 'white', fontWeight: 700, fontSize: '0.7rem' }} />
      </Stack>
      <Stack direction="row" spacing={2} mt={0.5}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color }}>{data.duration_traffic || data.duration_normal}</Typography>
          <Typography variant="caption" color="text.secondary">mit Verkehr</Typography>
        </Box>
        {data.delay_seconds && data.delay_seconds > 60 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WarningIcon sx={{ color: '#ff9800', fontSize: 16 }} />
            <Typography variant="caption" sx={{ color: '#ff9800' }}>+{Math.round(data.delay_seconds / 60)} Min</Typography>
          </Box>
        )}
      </Stack>
      <Typography variant="caption" color="text.secondary">{data.distance} &nbsp;·&nbsp; Normal: {data.duration_normal}</Typography>
    </Box>
  );
}

export function TrafficWidget() {
  const [traffic, setTraffic] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = () => api.get('/traffic').then(r => { setTraffic(r.data); setLoading(false); }).catch(() => setLoading(false));

  useEffect(() => { fetch(); }, []);
  useInterval(fetch, 5 * 60 * 1000);

  if (loading) return <CircularProgress size={24} />;
  if (traffic?.error) return <Typography variant="body2" color="text.secondary">{traffic.error}</Typography>;
  if (!traffic?.dad && !traffic?.mom) return <Typography variant="body2" color="text.secondary">Adressen konfigurieren</Typography>;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <DirectionsCarIcon sx={{ color: 'primary.main' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>Verkehr zur Arbeit</Typography>
      </Stack>
      <Stack spacing={1}>
        <TrafficCard label="Papa" data={traffic.dad} />
        <TrafficCard label="Mama" data={traffic.mom} />
      </Stack>
    </Box>
  );
}

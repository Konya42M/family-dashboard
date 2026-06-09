import { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import api from '../../api/client';
import { useInterval } from '../../hooks/useInterval';

interface TrafficInfo { duration_normal?: string; duration_traffic?: string; distance?: string; delay_seconds?: number; status?: 'green' | 'yellow' | 'red'; error?: string; }
interface TrafficData { dad: TrafficInfo | null; mom: TrafficInfo | null; error?: string; }

const STATUS_COLOR = { green: '#4caf50', yellow: '#ff9800', red: '#f44336' };
const STATUS_LABEL = { green: 'Frei', yellow: 'Leicht', red: 'Stau' };
const STATUS_BG = { green: 'rgba(76,175,80,0.12)', yellow: 'rgba(255,152,0,0.12)', red: 'rgba(244,67,54,0.12)' };

function TrafficRow({ label, data }: { label: string; data: TrafficInfo | null }) {
  if (!data) return null;
  if (data.error) return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 0.8, borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>Nicht konfiguriert</Typography>
    </Stack>
  );
  const s = data.status || 'green';
  const color = STATUS_COLOR[s];
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{
      px: 1, py: 0.8, borderRadius: 2,
      background: STATUS_BG[s],
      border: `1px solid ${color}33`,
    }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 6px ${color}` }} />
        <Box>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.primary', lineHeight: 1 }}>{label}</Typography>
          <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', lineHeight: 1, mt: 0.2 }}>{data.distance}</Typography>
        </Box>
      </Stack>
      <Box sx={{ textAlign: 'right' }}>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: '"JetBrains Mono", monospace' }}>
          {data.duration_traffic || data.duration_normal}
        </Typography>
        {data.delay_seconds && data.delay_seconds > 60 ? (
          <Typography sx={{ fontSize: '0.6rem', color: '#ff9800', lineHeight: 1, mt: 0.1 }}>+{Math.round(data.delay_seconds / 60)} Min</Typography>
        ) : (
          <Typography sx={{ fontSize: '0.6rem', color, lineHeight: 1, mt: 0.1 }}>{STATUS_LABEL[s]}</Typography>
        )}
      </Box>
    </Stack>
  );
}

export function TrafficWidget() {
  const [traffic, setTraffic] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    api.get('/traffic').then(r => { setTraffic(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);
  useInterval(fetchData, 300000);

  const hasNoConfig = traffic && !traffic.dad && !traffic.mom;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={0.8} mb={1}>
        <DirectionsCarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary">Verkehr zur Arbeit</Typography>
      </Stack>

      {loading ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          <Box className="shimmer" sx={{ height: 44, borderRadius: 2 }} />
          <Box className="shimmer" sx={{ height: 44, borderRadius: 2, opacity: 0.6 }} />
        </Box>
      ) : hasNoConfig ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          <TrafficRow label="Papa" data={{ error: 'Nicht konfiguriert' }} />
          <TrafficRow label="Mama" data={{ error: 'Nicht konfiguriert' }} />
          <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', textAlign: 'center', mt: 0.5 }}>
            Adressen in Einstellungen eintragen
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          <TrafficRow label="Papa" data={traffic?.dad || null} />
          <TrafficRow label="Mama" data={traffic?.mom || null} />
        </Box>
      )}
    </Box>
  );
}


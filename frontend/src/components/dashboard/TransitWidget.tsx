import { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import api from '../../api/client';
import { useInterval } from '../../hooks/useInterval';

interface Departure {
  line: string;
  direction: string;
  type: string;
  planned: string;
  realtime: string;
  delay: number;
  platform?: string;
}

function LineChip({ type, line }: { type: string; line: string }) {
  const isTram = type === 'tram';
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.4,
      px: 0.8, py: 0.3, borderRadius: 1.5, minWidth: 36, justifyContent: 'center',
      background: isTram ? 'rgba(77,144,254,0.25)' : 'rgba(255,152,0,0.25)',
      border: `1px solid ${isTram ? 'rgba(77,144,254,0.4)' : 'rgba(255,152,0,0.4)'}`,
    }}>
      {isTram
        ? <DirectionsTransitIcon sx={{ fontSize: 10, color: '#80b0ff' }} />
        : <DirectionsBusIcon sx={{ fontSize: 10, color: '#ffb74d' }} />}
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: isTram ? '#80b0ff' : '#ffb74d', lineHeight: 1 }}>
        {line}
      </Typography>
    </Box>
  );
}

export function TransitWidget() {
  const [data, setData] = useState<{ stopName: string; departures: Departure[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    api.get('/transit/departures').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);
  useInterval(fetchData, 60000);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="caption" color="text.secondary">{data?.stopName || 'ÖPNV Abfahrten'}</Typography>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4caf50', animation: 'blink 2s ease-in-out infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
          <Typography sx={{ fontSize: '0.6rem', color: '#4caf50', fontWeight: 600, letterSpacing: '0.05em' }}>LIVE</Typography>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {[...Array(4)].map((_, i) => <Box key={i} className="shimmer" sx={{ height: 28, borderRadius: 1.5, opacity: 1 - i * 0.15 }} />)}
        </Box>
      ) : !data?.departures?.length ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Keine Abfahrten verfügbar</Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
          {data.departures.slice(0, 5).map((dep, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={1} sx={{
              px: 1, py: 0.5, borderRadius: 2,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <LineChip type={dep.type} line={dep.line} />
              <Typography sx={{ flex: 1, fontSize: '0.72rem', color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {dep.direction}
              </Typography>
              <Box sx={{ textAlign: 'right', minWidth: 42 }}>
                <Typography sx={{
                  fontSize: '0.8rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                  fontFamily: '"JetBrains Mono", monospace',
                  color: dep.delay > 0 ? '#ff9800' : 'rgba(255,255,255,0.85)', lineHeight: 1,
                }}>
                  {dep.realtime || dep.planned}
                </Typography>
                {dep.delay > 0 && <Typography sx={{ fontSize: '0.6rem', color: '#ff9800', lineHeight: 1, mt: 0.1 }}>+{dep.delay}m</Typography>}
              </Box>
            </Stack>
          ))}
        </Box>
      )}
    </Box>
  );
}


import { useState, useEffect } from 'react';
import { Box, Typography, Stack, Chip, CircularProgress } from '@mui/material';
import TramIcon from '@mui/icons-material/Tram';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import api from '../../api/client';
import { Departure } from '../../types';
import { useInterval } from '../../hooks/useInterval';

interface TransitData { stopName: string; departures: Departure[]; }

function DepartureRow({ dep }: { dep: Departure }) {
  const isTram = dep.type === 'tram';
  const isDelayed = dep.delay > 2;
  const now = new Date();
  const [h, m] = dep.realtime.split(':').map(Number);
  const depDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const minutesLeft = Math.max(0, Math.round((depDate.getTime() - now.getTime()) / 60000));

  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Chip
        icon={isTram ? <TramIcon sx={{ fontSize: '14px !important' }} /> : <DirectionsBusIcon sx={{ fontSize: '14px !important' }} />}
        label={dep.line}
        size="small"
        sx={{ bgcolor: isTram ? '#1565c0' : '#388e3c', color: 'white', fontWeight: 700, minWidth: 52 }}
      />
      <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {dep.direction}
      </Typography>
      <Box sx={{ textAlign: 'right', minWidth: 60 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: isDelayed ? 'error.main' : 'success.main', fontVariantNumeric: 'tabular-nums' }}>
          {minutesLeft === 0 ? 'Jetzt' : `${minutesLeft} Min`}
        </Typography>
        {isDelayed && <Typography variant="caption" sx={{ color: 'error.main' }}>+{dep.delay} Min</Typography>}
      </Box>
    </Stack>
  );
}

export function TransitWidget() {
  const [data, setData] = useState<TransitData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = () => api.get('/transit/departures').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));

  useEffect(() => { fetch(); }, []);
  useInterval(fetch, 60 * 1000);

  if (loading) return <CircularProgress size={24} />;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <TramIcon sx={{ color: '#1565c0' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
          {data?.stopName || 'Abfahrten'}
        </Typography>
      </Stack>
      {!data?.departures?.length
        ? <Typography variant="body2" color="text.secondary">Keine Abfahrten</Typography>
        : data.departures.slice(0, 6).map((d, i) => <DepartureRow key={i} dep={d} />)
      }
    </Box>
  );
}

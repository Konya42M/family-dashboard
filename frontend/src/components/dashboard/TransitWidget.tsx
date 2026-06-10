import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Tabs, Tab, Chip, Stack, CircularProgress } from '@mui/material';
import DirectionsRailwayRoundedIcon from '@mui/icons-material/DirectionsRailwayRounded';
import DirectionsBusRoundedIcon from '@mui/icons-material/DirectionsBusRounded';
import api from '../../api/client';

interface Departure {
  line: string;
  direction: string;
  planned: string;
  realtime: string;
  delayMin: number;
  minutesUntil: number;
  type: string;
  platform?: string;
}

function minutesUntil(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 99;
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const depMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let diff = depMinutes - nowMinutes;
  if (diff < -60) diff += 24 * 60; // Midnight overflow
  return diff;
}

export function TransitWidget({ compact = false }: { compact?: boolean }) {
  const [tab, setTab] = useState(0);
  const [railDeps, setRailDeps] = useState<Departure[]>([]);
  const [busDeps, setBusDeps] = useState<Departure[]>([]);
  const [stopName, setStopName] = useState('ÖPNV');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDepartures = useCallback(async () => {
    try {
      const [rail, bus] = await Promise.all([
        api.get('/transit/departures?type=rail').then(r => r.data),
        api.get('/transit/departures?type=bus').then(r => r.data),
      ]);
      setRailDeps(Array.isArray(rail?.departures) ? rail.departures : []);
      setBusDeps(Array.isArray(bus?.departures) ? bus.departures : []);
      if (rail?.stopName) setStopName(rail.stopName);
      setError('');
    } catch {
      setError('Keine Verbindung');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepartures(); }, [fetchDepartures]);
  useEffect(() => {
    const id = setInterval(fetchDepartures, 60_000);
    return () => clearInterval(id);
  }, [fetchDepartures]);

  // Countdown-Tick alle 30 Sekunden
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const deps = tab === 0 ? railDeps : busDeps;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" sx={{ px: 1.5, pt: 1, pb: 0.5, flexShrink: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: compact ? '0.72rem' : '0.82rem', flex: 1 }}>
          {stopName}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#3ecf8e' }} />
          <Typography sx={{ fontSize: '0.58rem', color: '#3ecf8e', fontWeight: 700, letterSpacing: '0.06em' }}>LIVE</Typography>
        </Stack>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{
          minHeight: 32,
          flexShrink: 0,
          '& .MuiTab-root': { minHeight: 32, py: 0, fontSize: '0.7rem' },
        }}
      >
        <Tab icon={<DirectionsRailwayRoundedIcon sx={{ fontSize: 14 }} />} iconPosition="start" label="Bahn" />
        <Tab icon={<DirectionsBusRoundedIcon sx={{ fontSize: 14 }} />} iconPosition="start" label="Bus" />
      </Tabs>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
            <CircularProgress size={20} />
          </Box>
        )}
        {error && (
          <Typography sx={{ fontSize: '0.75rem', color: 'error.main', p: 1 }}>{error}</Typography>
        )}
        {!loading && !error && deps.map((dep, i) => {
          const displayTime = dep.realtime || dep.planned;
          const mins = minutesUntil(displayTime);
          const isDelayed = dep.delayMin > 0;
          const minuteColor = mins <= 0 ? 'error.main' : mins <= 3 ? 'warning.main' : 'success.main';
          const chipColor = tab === 0 ? '#1565c0' : '#2e7d32';
          return (
            <Box key={`${dep.line}-${dep.planned}-${i}`} sx={{
              display: 'flex', alignItems: 'center', gap: 1, py: 0.75,
              borderBottom: '1px solid', borderColor: 'divider',
            }}>
              <Chip
                label={dep.line}
                size="small"
                sx={{
                  fontWeight: 800, fontSize: '0.65rem', minWidth: 36,
                  bgcolor: chipColor, color: '#fff',
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                  fontSize: '0.72rem', fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {dep.direction}
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                  {dep.realtime || dep.planned} Uhr
                  {isDelayed && (
                    <span style={{ color: '#f44336', marginLeft: 4 }}>+{dep.delayMin} min</span>
                  )}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography sx={{
                  fontSize: '0.8rem', fontWeight: 800,
                  color: minuteColor,
                }}>
                  {mins <= 0 ? 'Jetzt' : `${mins} min`}
                </Typography>
              </Box>
            </Box>
          );
        })}
        {!loading && !error && deps.length === 0 && (
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', p: 1 }}>
            Keine Abfahrten
          </Typography>
        )}
      </Box>
    </Box>
  );
}

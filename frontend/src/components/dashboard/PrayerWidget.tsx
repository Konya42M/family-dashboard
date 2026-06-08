import { useState, useEffect } from 'react';
import { Box, Typography, Chip, LinearProgress, Stack } from '@mui/material';
import { format, parse, differenceInSeconds } from 'date-fns';
import api from '../../api/client';
import { PrayerTimes } from '../../types';
import { useInterval } from '../../hooks/useInterval';

const PRAYER_NAMES: { key: keyof Omit<PrayerTimes, 'date'>; label: string; arabic: string }[] = [
  { key: 'fajr', label: 'Fajr', arabic: 'الفجر' },
  { key: 'sunrise', label: 'Schurouk', arabic: 'الشروق' },
  { key: 'dhuhr', label: 'Dhuhr', arabic: 'الظهر' },
  { key: 'asr', label: 'Asr', arabic: 'العصر' },
  { key: 'maghrib', label: 'Maghrib', arabic: 'المغرب' },
  { key: 'isha', label: 'Isha', arabic: 'العشاء' },
];

function parseTime(timeStr: string): Date {
  const today = format(new Date(), 'yyyy-MM-dd');
  try {
    return parse(`${today} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date());
  } catch {
    return new Date();
  }
}

function getNextPrayer(prayers: PrayerTimes): { key: string; label: string; time: Date; secondsLeft: number } | null {
  const now = new Date();
  for (const p of PRAYER_NAMES) {
    if (p.key === 'sunrise') continue;
    const t = parseTime(prayers[p.key]);
    if (t > now) {
      return { key: p.key, label: p.label, time: t, secondsLeft: differenceInSeconds(t, now) };
    }
  }
  return null;
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function PrayerWidget() {
  const [prayers, setPrayers] = useState<PrayerTimes | null>(null);
  const [countdown, setCountdown] = useState('');
  const [nextKey, setNextKey] = useState('');

  useEffect(() => {
    api.get('/prayers').then(r => setPrayers(r.data)).catch(() => {});
  }, []);

  useInterval(() => {
    api.get('/prayers').then(r => setPrayers(r.data)).catch(() => {});
  }, 1000 * 60 * 60);

  useInterval(() => {
    if (!prayers) return;
    const next = getNextPrayer(prayers);
    if (next) {
      setNextKey(next.key);
      setCountdown(formatCountdown(next.secondsLeft));
    }
  }, 1000);

  if (!prayers) return <Box sx={{ height: 80 }}><LinearProgress /></Box>;

  const next = getNextPrayer(prayers);

  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
        Gebetszeiten
      </Typography>
      {next && (
        <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 3, bgcolor: 'primary.main', background: 'linear-gradient(135deg, #1565c0, #0d47a1)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Nächstes Gebet</Typography>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>{next.label}</Typography>
            <Typography variant="h6" sx={{ color: '#90caf9', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{countdown}</Typography>
          </Stack>
        </Box>
      )}
      <Stack spacing={0.5}>
        {PRAYER_NAMES.map(p => {
          const isNext = p.key === nextKey;
          const isPast = !isNext && prayers[p.key] && parseTime(prayers[p.key]) < new Date();
          return (
            <Stack key={p.key} direction="row" alignItems="center" justifyContent="space-between"
              sx={{ px: 1.5, py: 0.75, borderRadius: 2, bgcolor: isNext ? 'primary.dark' : 'transparent', opacity: isPast ? 0.4 : 1, transition: 'all 0.3s' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontSize: '0.85rem', color: isNext ? 'primary.light' : 'text.secondary' }}>{p.arabic}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: isNext ? 700 : 400 }}>{p.label}</Typography>
              </Stack>
              <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.9rem' }}>
                {prayers[p.key]}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

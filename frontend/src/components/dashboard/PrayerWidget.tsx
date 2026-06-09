import { useState, useEffect } from 'react';
import { Box, Typography, Stack, LinearProgress } from '@mui/material';
import { format, parse, differenceInSeconds } from 'date-fns';
import api from '../../api/client';
import { PrayerTimes } from '../../types';
import { useInterval } from '../../hooks/useInterval';

const PRAYERS: { key: keyof Omit<PrayerTimes, 'date' | 'cityId'>; label: string; arabic: string; tr: string }[] = [
  { key: 'fajr',    label: 'Fajr',    arabic: 'الفجر',  tr: 'İmsak'   },
  { key: 'sunrise', label: 'Şuruq',   arabic: 'الشروق', tr: 'Güneş'   },
  { key: 'dhuhr',   label: 'Dhuhr',   arabic: 'الظهر',  tr: 'Öğle'    },
  { key: 'asr',     label: 'Asr',     arabic: 'العصر',  tr: 'İkindi'  },
  { key: 'maghrib', label: 'Maghrib', arabic: 'المغرب', tr: 'Akşam'   },
  { key: 'isha',    label: 'Yatsı',   arabic: 'العشاء', tr: 'Yatsı'   },
];

function parseTime(timeStr: string): Date {
  const today = format(new Date(), 'yyyy-MM-dd');
  try { return parse(`${today} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date()); }
  catch { return new Date(); }
}

function getNextPrayer(p: PrayerTimes) {
  const now = new Date();
  for (const pr of PRAYERS) {
    if (pr.key === 'sunrise') continue;
    const t = parseTime(p[pr.key]);
    if (t > now) return { ...pr, time: t, secondsLeft: differenceInSeconds(t, now) };
  }
  return null;
}

function formatCountdown(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function getProgressPercent(prayers: PrayerTimes, nextKey: string): number {
  const now = new Date();
  const idx = PRAYERS.findIndex(p => p.key === nextKey);
  if (idx <= 0) return 0;
  const prevKey = PRAYERS[idx - 1].key as keyof Omit<PrayerTimes, 'date' | 'cityId'>;
  const nKey = nextKey as keyof Omit<PrayerTimes, 'date' | 'cityId'>;
  const prev = parseTime(prayers[prevKey]);
  const next = parseTime(prayers[nKey]);
  const total = differenceInSeconds(next, prev);
  const elapsed = differenceInSeconds(now, prev);
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function PrayerWidget() {
  const [prayers, setPrayers] = useState<PrayerTimes | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => { api.get('/prayers').then(r => setPrayers(r.data)).catch(() => {}); }, []);
  useInterval(() => { api.get('/prayers').then(r => setPrayers(r.data)).catch(() => {}); }, 3600000);
  useInterval(() => setTick(t => t + 1), 1000);

  if (!prayers) return (
    <Box sx={{ p: 1 }}>
      <Typography variant="caption" color="text.secondary">Gebetszeiten</Typography>
      <Box sx={{ mt: 1 }}><LinearProgress /></Box>
    </Box>
  );

  const next = getNextPrayer(prayers);
  const progress = next ? getProgressPercent(prayers, next.key) : 0;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="caption" color="text.secondary">Gebetszeiten · Stuttgart</Typography>
        <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,196,0,0.7)', fontWeight: 600, letterSpacing: '0.05em' }}>
          DIYANET
        </Typography>
      </Stack>

      {/* Next Prayer Highlight */}
      {next && (
        <Box className="prayer-next-glow" sx={{
          mb: 1.5,
          p: 1.5,
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, rgba(255,196,0,0.12) 0%, rgba(255,196,0,0.06) 100%)',
          border: '1px solid rgba(255,196,0,0.25)',
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,196,0,0.6)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Nächstes Gebet
              </Typography>
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffd740' }}>
                  {next.label}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  {next.tr}
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,196,0,0.8)', direction: 'rtl', fontFamily: 'serif' }}>
                  {next.arabic}
                </Typography>
              </Stack>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{
                fontSize: '1.3rem',
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                fontFamily: '"JetBrains Mono", monospace',
                color: '#ffd740',
                lineHeight: 1,
              }}>
                {formatCountdown(next.secondsLeft)}
              </Typography>
              <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,196,0,0.5)', letterSpacing: '0.05em', mt: 0.3 }}>
                {format(next.time, 'HH:mm')} Uhr
              </Typography>
            </Box>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              mt: 1, height: 3, borderRadius: 2,
              bgcolor: 'rgba(255,196,0,0.1)',
              '& .MuiLinearProgress-bar': { bgcolor: 'rgba(255,196,0,0.7)', borderRadius: 2 },
            }}
          />
        </Box>
      )}

      {/* Prayer List */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        {PRAYERS.map(p => {
          const isNext = next?.key === p.key;
          const time = parseTime(prayers[p.key]);
          const isPast = !isNext && time < new Date();
          return (
            <Stack
              key={p.key}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 1.2,
                py: 0.6,
                borderRadius: 2,
                background: isNext ? 'rgba(255,196,0,0.08)' : 'rgba(255,255,255,0.025)',
                border: isNext ? '1px solid rgba(255,196,0,0.2)' : '1px solid transparent',
                opacity: isPast ? 0.35 : 1,
                transition: 'all 0.3s',
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Typography sx={{
                  fontSize: '0.8rem',
                  fontFamily: 'serif',
                  color: isNext ? 'rgba(255,196,0,0.9)' : 'rgba(255,255,255,0.35)',
                  direction: 'rtl',
                  minWidth: 32,
                  textAlign: 'right',
                }}>
                  {p.arabic}
                </Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: isNext ? 700 : 500, color: isNext ? '#ffd740' : 'text.primary', lineHeight: 1 }}>
                    {p.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', lineHeight: 1, mt: 0.1 }}>
                    {p.tr}
                  </Typography>
                </Box>
              </Stack>
              <Typography sx={{
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.85rem',
                color: isNext ? '#ffd740' : 'rgba(255,255,255,0.7)',
              }}>
                {prayers[p.key]}
              </Typography>
            </Stack>
          );
        })}
      </Box>
    </Box>
  );
}


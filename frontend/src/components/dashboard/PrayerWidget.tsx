import { useState, useEffect } from 'react';
import { Box, Typography, Stack, LinearProgress } from '@mui/material';
import { format, parse, differenceInSeconds } from 'date-fns';
import api from '../../api/client';
import { PrayerTimes } from '../../types';
import { useInterval } from '../../hooks/useInterval';

const PRAYERS: { key: keyof Omit<PrayerTimes,'date'|'cityId'>; de: string; tr: string; ar: string }[] = [
  { key:'fajr',    de:'Fajr',    tr:'İmsak',  ar:'الفجر'  },
  { key:'sunrise', de:'Şuruq',   tr:'Güneş',  ar:'الشروق' },
  { key:'dhuhr',   de:'Öğle',    tr:'Öğle',   ar:'الظهر'  },
  { key:'asr',     de:'İkindi',  tr:'İkindi', ar:'العصر'  },
  { key:'maghrib', de:'Akşam',   tr:'Akşam',  ar:'المغرب' },
  { key:'isha',    de:'Yatsı',   tr:'Yatsı',  ar:'العشاء' },
];

function parseT(t: string): Date {
  try { return parse(`${format(new Date(),'yyyy-MM-dd')} ${t}`, 'yyyy-MM-dd HH:mm', new Date()); }
  catch { return new Date(); }
}

function nextPrayer(p: PrayerTimes) {
  const now = new Date();
  for (const pr of PRAYERS) {
    if (pr.key === 'sunrise') continue;
    const t = parseT(p[pr.key]);
    if (t > now) return { ...pr, time: t, secs: differenceInSeconds(t, now) };
  }
  return null;
}

function fmtCountdown(s: number) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  if (h>0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

export function PrayerWidget() {
  const [prayers, setPrayers] = useState<PrayerTimes|null>(null);
  const [, setTick] = useState(0);

  useEffect(() => { api.get('/prayers').then(r=>setPrayers(r.data)).catch(()=>{}); }, []);
  useInterval(() => { api.get('/prayers').then(r=>setPrayers(r.data)).catch(()=>{}); }, 3600000);
  useInterval(() => setTick(t=>t+1), 1000);

  if (!prayers) return <Box><Typography variant="caption" color="text.secondary">Gebetszeiten laden...</Typography><LinearProgress sx={{mt:1}}/></Box>;

  const next = nextPrayer(prayers);
  const now = new Date();

  return (
    <Box sx={{ height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.8}>
        <Typography variant="caption" color="text.secondary">Gebetszeiten · Stuttgart</Typography>
        <Typography sx={{ fontSize:'0.58rem', color:'#f5a623', fontWeight:700, letterSpacing:'0.06em' }}>DIYANET</Typography>
      </Stack>

      {/* Next prayer card */}
      {next && (
        <Box sx={{ mb:1, p:'8px 12px', borderRadius:2.5, background:'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.07))', border:'1px solid rgba(245,166,35,0.3)' }}>
          <Typography sx={{ fontSize:'0.58rem', color:'rgba(245,166,35,0.7)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>Nächstes Gebet</Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.3}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography sx={{ fontSize:'0.95rem', fontWeight:800, color:'#f5c842' }}>{next.de}</Typography>
              <Typography sx={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.45)' }}>{next.tr}</Typography>
              <Typography sx={{ fontSize:'0.85rem', fontFamily:'serif', color:'rgba(245,166,35,0.6)', direction:'rtl' }}>{next.ar}</Typography>
            </Stack>
            <Typography sx={{ fontSize:'1.3rem', fontWeight:900, color:'#f5c842', fontVariantNumeric:'tabular-nums', letterSpacing:'-1px' }}>
              {fmtCountdown(next.secs)}
            </Typography>
          </Stack>
          <LinearProgress variant="determinate"
            value={Math.min(100, ((differenceInSeconds(now, parseT(prayers.fajr)) / Math.max(1, differenceInSeconds(next.time, parseT(prayers.fajr)))) * 100))}
            sx={{ mt:0.8, height:2, borderRadius:1, bgcolor:'rgba(245,166,35,0.1)', '& .MuiLinearProgress-bar':{ bgcolor:'rgba(245,166,35,0.7)' } }} />
        </Box>
      )}

      {/* Prayer list */}
      <Box sx={{ flex:1, display:'flex', flexDirection:'column', gap:'3px' }}>
        {PRAYERS.map(p => {
          const isNext = next?.key === p.key;
          const t = parseT(prayers[p.key]);
          const isPast = !isNext && t < now;
          return (
            <Stack key={p.key} direction="row" alignItems="center" justifyContent="space-between"
              sx={{ px:1, py:'5px', borderRadius:1.5, background: isNext ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.025)', border: isNext ? '1px solid rgba(245,166,35,0.25)' : '1px solid transparent', opacity: isPast ? 0.3 : 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontSize:'0.78rem', fontFamily:'serif', color: isNext ? 'rgba(245,166,35,0.8)' : 'rgba(255,255,255,0.25)', minWidth:28, textAlign:'right', direction:'rtl' }}>{p.ar}</Typography>
                <Box>
                  <Typography sx={{ fontSize:'0.75rem', fontWeight: isNext ? 700 : 500, color: isNext ? '#f5c842' : 'text.primary', lineHeight:1 }}>{p.de}</Typography>
                  <Typography sx={{ fontSize:'0.58rem', color:'text.secondary', lineHeight:1 }}>{p.tr}</Typography>
                </Box>
              </Stack>
              <Typography sx={{ fontWeight:700, fontVariantNumeric:'tabular-nums', fontSize:'0.82rem', color: isNext ? '#f5c842' : 'rgba(255,255,255,0.7)', letterSpacing:'0.5px' }}>
                {prayers[p.key]}
              </Typography>
            </Stack>
          );
        })}
      </Box>
    </Box>
  );
}


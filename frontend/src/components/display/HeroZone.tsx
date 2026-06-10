import { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../api/client';

function getWeather(code: number): { icon: string; label: string } {
  if (code === 0)               return { icon: '☀️',  label: 'Sonnig' };
  if (code <= 2)                return { icon: '🌤️', label: 'Heiter' };
  if (code === 3)               return { icon: '☁️',  label: 'Bewölkt' };
  if (code >= 45 && code <= 48) return { icon: '🌫️', label: 'Nebel' };
  if (code <= 55)               return { icon: '🌦️', label: 'Nieselregen' };
  if (code <= 65)               return { icon: '🌧️', label: 'Regen' };
  if (code <= 77)               return { icon: '❄️',  label: 'Schnee' };
  if (code <= 82)               return { icon: '🌦️', label: 'Schauer' };
  if (code <= 86)               return { icon: '🌨️', label: 'Schneeschauer' };
  if (code >= 95)               return { icon: '⛈️', label: 'Gewitter' };
  return                               { icon: '🌡️', label: '–' };
}

const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
const PRAYER_NAMES: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

function timeToMinutes(t: string): number {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return h * 60 + m;
}

function getNextPrayer(prayers: Record<string, string>): { name: string; time: string; minsLeft: number } | null {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  for (const key of PRAYER_ORDER) {
    if (!prayers[key]) continue;
    const mins = timeToMinutes(prayers[key]);
    if (mins > nowMins) return { name: PRAYER_NAMES[key], time: prayers[key], minsLeft: mins - nowMins };
  }
  if (prayers.fajr) {
    return { name: 'Fajr', time: prayers.fajr, minsLeft: (24 * 60 - nowMins) + timeToMinutes(prayers.fajr) };
  }
  return null;
}

export function HeroZone() {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  useEffect(() => {
    const load = () => api.get('/weather').then(r => {
      const d = r.data?.current;
      if (d) setWeather({ temp: Math.round(d.temp), code: d.code ?? d.weathercode ?? 0 });
    }).catch(() => {});
    load();
    const id = setInterval(load, 15 * 60_000);
    return () => clearInterval(id);
  }, []);

  const [prayers, setPrayers] = useState<Record<string, string>>({});
  const [prayerTick, setPrayerTick] = useState(0);
  useEffect(() => {
    const load = () => api.get('/prayers').then(r => { if (r.data) setPrayers(r.data); }).catch(() => {});
    load();
    const id = setInterval(load, 60 * 60_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setPrayerTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const nextPrayer = getNextPrayer(prayers);
  const weatherInfo = weather ? getWeather(weather.code) : null;

  const hijri = (() => {
    try {
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric', month: 'long', year: 'numeric',
      }).format(now);
    } catch { return ''; }
  })();

  const hours = String(now.getHours()).padStart(2, '0');
  const mins  = String(now.getMinutes()).padStart(2, '0');
  const showColon = now.getSeconds() % 2 === 0;

  const bg     = dark ? '#0d0f18' : '#f4f6fc';
  const border = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const txtMain= dark ? '#eef0f7' : '#111827';
  const txtSub = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      px: 2.5, py: 1.5,
      borderBottom: `1px solid ${border}`,
      background: bg,
      minHeight: 130,
      gap: 1,
    }}>

      {/* ── LINKS: Zeit & Datum ─────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
          <Typography className="num" sx={{ fontSize: 'clamp(3rem, 8vw, 4.2rem)', fontWeight: 800, lineHeight: 1, color: txtMain, letterSpacing: '-0.03em' }}>
            {hours}
          </Typography>
          <Typography className="num" sx={{
            fontSize: 'clamp(3rem, 8vw, 4.2rem)', fontWeight: 800, lineHeight: 1,
            color: showColon ? txtMain : 'transparent',
            letterSpacing: '-0.03em', mx: '1px', transition: 'color 0.1s',
          }}>:</Typography>
          <Typography className="num" sx={{ fontSize: 'clamp(3rem, 8vw, 4.2rem)', fontWeight: 800, lineHeight: 1, color: txtMain, letterSpacing: '-0.03em' }}>
            {mins}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: txtSub, lineHeight: 1.2 }}>
          {format(now, 'EEEE, d. MMMM yyyy', { locale: de })}
        </Typography>
        {hijri && (
          <Typography sx={{ fontSize: '0.7rem', color: dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.3)', fontWeight: 500 }}>
            {hijri}
          </Typography>
        )}
      </Box>

      {/* ── MITTE: Wetter ───────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4, px: 3 }}>
        {weatherInfo ? (
          <>
            <Typography sx={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', lineHeight: 1, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }}>
              {weatherInfo.icon}
            </Typography>
            <Typography className="num" sx={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, color: txtMain }}>
              {weather?.temp}°
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: txtSub }}>
              {weatherInfo.label}
            </Typography>
          </>
        ) : (
          <Typography sx={{ fontSize: '1.5rem', color: txtSub, opacity: 0.4 }}>—</Typography>
        )}
      </Box>

      {/* ── RECHTS: Nächste Gebetszeit ──────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {nextPrayer ? (
          <Box sx={{
            p: '10px 14px', borderRadius: '14px',
            background: dark ? 'rgba(245,166,35,0.08)' : 'rgba(245,166,35,0.09)',
            border: '1px solid rgba(245,166,35,0.22)',
            textAlign: 'right',
          }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#f5a623', letterSpacing: '0.09em', textTransform: 'uppercase', mb: 0.4 }}>
              Nächstes Gebet
            </Typography>
            <Typography sx={{ fontSize: '1.45rem', fontWeight: 800, color: txtMain, lineHeight: 1, mb: 0.2 }}>
              {nextPrayer.name}
            </Typography>
            <Typography className="num" sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#f5a623', lineHeight: 1.3 }}>
              {nextPrayer.time} Uhr
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: txtSub, mt: 0.3 }}>
              in {nextPrayer.minsLeft < 60
                ? `${nextPrayer.minsLeft} min`
                : `${Math.floor(nextPrayer.minsLeft / 60)}h ${nextPrayer.minsLeft % 60}min`}
            </Typography>
          </Box>
        ) : (
          <Typography sx={{ fontSize: '0.72rem', color: txtSub }}>Gebetszeiten laden…</Typography>
        )}
      </Box>
    </Box>
  );
}

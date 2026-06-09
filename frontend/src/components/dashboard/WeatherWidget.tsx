import { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../api/client';
import { useInterval } from '../../hooks/useInterval';

interface Weather {
  temp: number; feelsLike: number; humidity: number; windSpeed: number;
  icon: string; label: string; city: string;
  forecast: { date: string; maxTemp: number; minTemp: number; icon: string; label: string; precipitation: number }[];
}

export function WeatherWidget() {
  const [w, setW] = useState<Weather | null>(null);
  useEffect(() => { api.get('/weather').then(r => setW(r.data)).catch(() => {}); }, []);
  useInterval(() => { api.get('/weather').then(r => setW(r.data)).catch(() => {}); }, 15 * 60 * 1000);

  if (!w) return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="caption" color="text.secondary">Wetter lädt…</Typography>
    </Box>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Current */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <Typography sx={{ fontSize: '2.2rem', lineHeight: 1 }}>{w.icon}</Typography>
        <Box>
          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-1px' }} className="num">
              {w.temp}°
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
              fühlbar {w.feelsLike}°
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>{w.label}</Typography>
        </Box>
        <Box sx={{ ml: 'auto', textAlign: 'right' }}>
          <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary' }}>💧 {w.humidity}%</Typography>
          <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary' }}>💨 {w.windSpeed} km/h</Typography>
        </Box>
      </Stack>

      {/* Forecast */}
      <Stack direction="row" spacing={0.5} sx={{ flex: 1 }}>
        {w.forecast.slice(0, 5).map((d, i) => {
          const date = parseISO(d.date);
          const label = i === 0 ? 'Heute' : i === 1 ? 'Morgen' : format(date, 'EEE', { locale: de });
          return (
            <Box key={d.date} sx={{
              flex: 1, textAlign: 'center', p: '4px 2px', borderRadius: 2,
              background: i === 0 ? 'rgba(91,141,238,0.1)' : 'rgba(128,128,128,0.05)',
              border: i === 0 ? '1px solid rgba(91,141,238,0.2)' : '1px solid transparent',
            }}>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: i===0 ? 'primary.main' : 'text.secondary', mb: '2px' }}>{label}</Typography>
              <Typography sx={{ fontSize: '1rem', lineHeight: 1.2 }}>{d.icon}</Typography>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.primary' }} className="num">{d.maxTemp}°</Typography>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }} className="num">{d.minTemp}°</Typography>
              {d.precipitation > 20 && (
                <Typography sx={{ fontSize: '0.55rem', color: '#5b8dee' }}>💧{d.precipitation}%</Typography>
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}


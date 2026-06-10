import { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../api/client';
import { useInterval } from '../../hooks/useInterval';

function getWeatherInfo(code: number): { icon: string; label: string; color: string } {
  if (code === 0)              return { icon: '☀️',  label: 'Sonnig',            color: '#FFB300' };
  if (code <= 2)               return { icon: '🌤️', label: 'Leicht bewölkt',    color: '#FFC107' };
  if (code === 3)              return { icon: '☁️',  label: 'Bewölkt',           color: '#90A4AE' };
  if (code >= 45 && code <= 48) return { icon: '🌫️', label: 'Nebel',             color: '#B0BEC5' };
  if (code <= 55)              return { icon: '🌦️', label: 'Nieselregen',       color: '#42A5F5' };
  if (code <= 65)              return { icon: '🌧️', label: 'Regen',             color: '#1E88E5' };
  if (code <= 77)              return { icon: '❄️',  label: 'Schnee',            color: '#81D4FA' };
  if (code <= 82)              return { icon: '🌦️', label: 'Regenschauer',      color: '#29B6F6' };
  if (code <= 86)              return { icon: '🌨️', label: 'Schneeschauer',     color: '#B3E5FC' };
  if (code === 95)             return { icon: '⛈️', label: 'Gewitter',          color: '#7B1FA2' };
  if (code >= 96)              return { icon: '⛈️', label: 'Hagel',             color: '#6A1B9A' };
  return                              { icon: '🌡️', label: 'Unbekannt',         color: '#78909C' };
}

interface Weather {
  temp: number; feelsLike: number; humidity: number; windSpeed: number;
  code: number;
  icon: string; label: string; city: string;
  forecast: { date: string; maxTemp: number; minTemp: number; code: number; icon: string; label: string; precipitation: number }[];
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

  const currentInfo = getWeatherInfo(w.code);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Current */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <Typography sx={{ fontSize: '4rem', lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
          {currentInfo.icon}
        </Typography>
        <Box>
          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-1px' }} className="num">
              {w.temp}°
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
              fühlbar {w.feelsLike}°
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: currentInfo.color }}>
            {currentInfo.label}
          </Typography>
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
          const forecastInfo = getWeatherInfo(d.code);
          return (
            <Box key={d.date} sx={{
              flex: 1, textAlign: 'center', p: '4px 2px', borderRadius: 2,
              background: i === 0 ? 'rgba(91,141,238,0.1)' : 'rgba(128,128,128,0.05)',
              border: i === 0 ? '1px solid rgba(91,141,238,0.2)' : '1px solid transparent',
            }}>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: i===0 ? 'primary.main' : 'text.secondary', mb: '2px' }}>{label}</Typography>
              <Typography sx={{ fontSize: '1.6rem', lineHeight: 1.2 }}>{forecastInfo.icon}</Typography>
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

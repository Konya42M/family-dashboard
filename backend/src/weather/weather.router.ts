import { Router, Response } from 'express';
import axios from 'axios';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Stuttgart coordinates
const LAT = 48.7558;
const LON = 9.1829;

let weatherCache: { data: any; expires: number } | null = null;

const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Klar', icon: '☀️' },
  1:  { label: 'Überwiegend klar', icon: '🌤️' },
  2:  { label: 'Teilweise bewölkt', icon: '⛅' },
  3:  { label: 'Bedeckt', icon: '☁️' },
  45: { label: 'Nebel', icon: '🌫️' },
  48: { label: 'Raureif', icon: '🌫️' },
  51: { label: 'Nieselregen', icon: '🌦️' },
  53: { label: 'Nieselregen', icon: '🌦️' },
  55: { label: 'Starker Nieselregen', icon: '🌧️' },
  61: { label: 'Leichter Regen', icon: '🌧️' },
  63: { label: 'Regen', icon: '🌧️' },
  65: { label: 'Starker Regen', icon: '🌧️' },
  71: { label: 'Leichter Schnee', icon: '🌨️' },
  73: { label: 'Schnee', icon: '❄️' },
  75: { label: 'Starker Schnee', icon: '❄️' },
  80: { label: 'Schauer', icon: '🌦️' },
  81: { label: 'Schauer', icon: '🌧️' },
  82: { label: 'Starke Schauer', icon: '⛈️' },
  95: { label: 'Gewitter', icon: '⛈️' },
  96: { label: 'Gewitter mit Hagel', icon: '⛈️' },
  99: { label: 'Starkes Gewitter', icon: '⛈️' },
};

router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  if (weatherCache && weatherCache.expires > Date.now()) {
    res.json(weatherCache.data);
    return;
  }

  try {
    const { data } = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&wind_speed_unit=kmh&timezone=Europe%2FBerlin&forecast_days=5`,
      { timeout: 8000 }
    );

    const cur = data.current;
    const wmo = WMO_CODES[cur.weather_code] || { label: 'Unbekannt', icon: '🌡️' };

    const forecast = (data.daily?.time || []).slice(0, 5).map((date: string, i: number) => ({
      date,
      maxTemp: Math.round(data.daily.temperature_2m_max[i]),
      minTemp: Math.round(data.daily.temperature_2m_min[i]),
      code: data.daily.weather_code[i] as number,
      icon: (WMO_CODES[data.daily.weather_code[i]] || { icon: '🌡️' }).icon,
      label: (WMO_CODES[data.daily.weather_code[i]] || { label: '' }).label,
      precipitation: data.daily.precipitation_probability_max[i] || 0,
    }));

    const result = {
      temp: Math.round(cur.temperature_2m),
      feelsLike: Math.round(cur.apparent_temperature),
      humidity: cur.relative_humidity_2m,
      windSpeed: Math.round(cur.wind_speed_10m),
      code: cur.weather_code as number,
      icon: wmo.icon,
      label: wmo.label,
      city: 'Stuttgart',
      forecast,
    };

    weatherCache = { data: result, expires: Date.now() + 15 * 60 * 1000 };
    res.json(result);
  } catch (e: any) {
    res.status(503).json({ error: 'Wetter nicht verfügbar', detail: e.message });
  }
});

export default router;

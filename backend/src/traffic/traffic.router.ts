import { Router, Response } from 'express';
import axios from 'axios';
import { getDatabase } from '../database/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

interface TrafficCache { data: any; expires: number; }
const trafficCache = new Map<string, TrafficCache>();

async function getTrafficData(origin: string, destination: string, apiKey: string) {
  const cacheKey = `${origin}|${destination}`;
  const cached = trafficCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data;

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&departure_time=now&traffic_model=best_guess&key=${apiKey}`;
  const { data } = await axios.get(url, { timeout: 8000 });
  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== 'OK') throw new Error('Route nicht gefunden');

  const result = {
    duration_normal: element.duration?.text,
    duration_normal_seconds: element.duration?.value,
    duration_traffic: element.duration_in_traffic?.text,
    duration_traffic_seconds: element.duration_in_traffic?.value,
    distance: element.distance?.text,
    delay_seconds: (element.duration_in_traffic?.value || 0) - (element.duration?.value || 0),
    status: getTrafficStatus(element.duration?.value, element.duration_in_traffic?.value),
  };

  trafficCache.set(cacheKey, { data: result, expires: Date.now() + 5 * 60 * 1000 });
  return result;
}

function getTrafficStatus(normal: number, withTraffic: number): 'green' | 'yellow' | 'red' {
  if (!normal || !withTraffic) return 'green';
  const ratio = withTraffic / normal;
  if (ratio < 1.2) return 'green';
  if (ratio < 1.5) return 'yellow';
  return 'red';
}

router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const settings = db.prepare('SELECT dad_work_address, mom_work_address, dad_work_origin, mom_work_origin, google_maps_api_key FROM settings WHERE id=1').get() as any;
  db.close();

  if (!settings?.google_maps_api_key) {
    res.json({ dad: null, mom: null, error: 'Google Maps API-Key nicht konfiguriert' });
    return;
  }

  const results: any = { dad: null, mom: null };

  if (settings.dad_work_address && settings.dad_work_origin) {
    try {
      results.dad = await getTrafficData(settings.dad_work_origin, settings.dad_work_address, settings.google_maps_api_key);
    } catch (e: any) {
      results.dad = { error: e.message };
    }
  }

  if (settings.mom_work_address && settings.mom_work_origin) {
    try {
      results.mom = await getTrafficData(settings.mom_work_origin, settings.mom_work_address, settings.google_maps_api_key);
    } catch (e: any) {
      results.mom = { error: e.message };
    }
  }

  res.json(results);
});

export default router;

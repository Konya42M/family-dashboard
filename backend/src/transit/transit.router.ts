import { Router, Response } from 'express';
import axios from 'axios';
import { getDatabase } from '../database/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

let departureCache: { data: any; expires: number } | null = null;

router.get('/departures', authenticate, async (req: AuthRequest, res: Response) => {
  const typeParam = req.query.type as string | undefined;

  if (departureCache && departureCache.expires > Date.now()) {
    const cached = departureCache.data as { stopName: string; departures: any[] };
    let filtered = cached.departures;
    if (typeParam === 'rail') {
      filtered = cached.departures.filter((d: any) => ['sbahn', 'ubahn', 'tram'].includes(d.type));
    } else if (typeParam === 'bus') {
      filtered = cached.departures.filter((d: any) => d.type === 'bus');
    }
    res.json({ stopName: cached.stopName, departures: filtered.slice(0, 8) });
    return;
  }

  const db = getDatabase();
  let settings: any;
  try {
    settings = db.prepare('SELECT vvs_stop_id, vvs_stop_name FROM settings WHERE id=1').get() as any;
  } finally {
    db.close();
  }

  // Default: Bernsteinstraße Stuttgart (5006137)
  const stopId = settings?.vvs_stop_id || '5006137';
  const stopName = settings?.vvs_stop_name || 'Bernsteinstraße';

  try {
    const url = `https://www3.vvs.de/mngvvs/XML_DM_REQUEST?outputFormat=JSON&language=de&stateless=1&type_dm=stop&name_dm=${stopId}&mode=direct&useRealtime=1&limit=12&useAllStops=1&depType=stopEvents`;
    const { data } = await axios.get(url, { timeout: 10000 });

    const now = new Date();
    const departures = (data.departureList || []).map((dep: any) => {
      const planned = dep.dateTime?.time || '';
      const realtime = dep.realDateTime?.time || planned;
      const delayMin = dep.realtimeTripId ? Math.max(0, timeToMinutes(realtime) - timeToMinutes(planned)) : 0;
      let delta = timeToMinutes(realtime) - (now.getHours() * 60 + now.getMinutes());
      if (delta < -60) delta += 24 * 60; // Midnight overflow
      const minutesUntil = Math.max(0, delta);
      const motType = dep.servingLine?.motType;
      return {
        line: dep.servingLine?.number || dep.servingLine?.name || '',
        direction: dep.servingLine?.direction || '',
        type: motType === '1' ? 'tram' : motType === '5' ? 'bus' : motType === '0' ? 'sbahn' : motType === '2' ? 'ubahn' : 'other',
        planned,
        realtime,
        delayMin,
        minutesUntil,
        platform: dep.platform || '',
      };
    }).filter((d: any) => d.minutesUntil >= 0 && d.minutesUntil <= 90); // includes post-midnight via overflow fix

    departureCache = { data: { stopName, departures }, expires: Date.now() + 60 * 1000 };

    let filtered = departures;
    if (typeParam === 'rail') {
      filtered = departures.filter((d: any) => ['sbahn', 'ubahn', 'tram'].includes(d.type));
    } else if (typeParam === 'bus') {
      filtered = departures.filter((d: any) => d.type === 'bus');
    }
    res.json({ stopName, departures: filtered.slice(0, 8) });
  } catch (e: any) {
    res.status(503).json({ error: 'VVS-Daten nicht verfügbar', detail: e.message });
  }
});

function timeToMinutes(time: string): number {
  const [h, m] = (time || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default router;

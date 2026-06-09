import { Router, Response } from 'express';
import axios from 'axios';
import { getDatabase } from '../database/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

let departureCache: { data: any; expires: number } | null = null;

router.get('/departures', authenticate, async (_req: AuthRequest, res: Response) => {
  if (departureCache && departureCache.expires > Date.now()) {
    res.json(departureCache.data);
    return;
  }

  const db = getDatabase();
  const settings = db.prepare('SELECT vvs_stop_id, vvs_stop_name FROM settings WHERE id=1').get() as any;
  db.close();

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
      const minutesUntil = Math.max(0, timeToMinutes(realtime) - (now.getHours() * 60 + now.getMinutes()));
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
    }).filter((d: any) => d.minutesUntil >= 0 && d.minutesUntil <= 90);

    departureCache = { data: { stopName, departures }, expires: Date.now() + 60 * 1000 };
    res.json(departureCache.data);
  } catch (e: any) {
    res.status(503).json({ error: 'VVS-Daten nicht verfügbar', detail: e.message });
  }
});

function timeToMinutes(time: string): number {
  const [h, m] = (time || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default router;


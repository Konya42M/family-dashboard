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

  const stopId = settings?.vvs_stop_id || '5006118';

  try {
    const url = `https://www3.vvs.de/mngvvs/XML_DM_REQUEST?outputFormat=JSON&language=de&stateless=1&type_dm=stop&name_dm=${stopId}&mode=direct&useRealtime=1&limit=10&useAllStops=1&depType=stopEvents`;
    const { data } = await axios.get(url, { timeout: 8000 });

    const departures = (data.departureList || []).map((dep: any) => ({
      line: dep.servingLine?.number || dep.servingLine?.name || '',
      direction: dep.servingLine?.direction || '',
      type: dep.servingLine?.motType === '1' ? 'tram' : dep.servingLine?.motType === '5' ? 'bus' : 'other',
      planned: dep.dateTime?.time || '',
      realtime: dep.realDateTime?.time || dep.dateTime?.time || '',
      delay: dep.realtimeTripId ? (
        timeToMinutes(dep.realDateTime?.time || '') - timeToMinutes(dep.dateTime?.time || '')
      ) : 0,
      platform: dep.platform || '',
    }));

    departureCache = { data: { stopName: settings?.vvs_stop_name || stopId, departures }, expires: Date.now() + 60 * 1000 };
    res.json(departureCache.data);
  } catch (e: any) {
    res.status(503).json({ error: 'VVS-Daten nicht verfügbar', detail: e.message });
  }
});

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default router;

import { Router, Response } from 'express';
import axios from 'axios';
import { getDatabase } from '../database/schema';
import { authenticate, requireParent, AuthRequest } from '../middleware/auth';

const router = Router();

async function getTrafficData(origin: string, destination: string, apiKey: string) {
  const res = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
    params: {
      origins: origin,
      destinations: destination,
      departure_time: 'now',
      traffic_model: 'best_guess',
      key: apiKey,
      language: 'de',
    },
  });
  const el = res.data?.rows?.[0]?.elements?.[0];
  if (!el || el.status !== 'OK') return null;
  const normalMins = Math.round((el.duration?.value ?? 0) / 60);
  const trafficMins = Math.round((el.duration_in_traffic?.value ?? el.duration?.value ?? 0) / 60);
  const delay = trafficMins - normalMins;
  return {
    durationMins: trafficMins,
    delayMins: delay,
    status: (delay > 10 ? 'red' : delay > 3 ? 'yellow' : 'green') as 'green' | 'yellow' | 'red',
    summary: el.duration_in_traffic?.text ?? el.duration?.text ?? '',
  };
}

// GET /api/traffic – alle aktiven Ziele mit Fahrzeiten
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  let settings: any;
  let dests: any[];
  try {
    settings = db.prepare('SELECT google_maps_api_key FROM settings WHERE id=1').get();
    dests = db.prepare('SELECT * FROM traffic_destinations WHERE active=1 ORDER BY sort_order').all();
  } finally {
    db.close();
  }

  if (!settings?.google_maps_api_key) {
    res.json(dests!.map((d: any) => ({ ...d, traffic: null, error: 'Kein API-Key konfiguriert' })));
    return;
  }

  const results = await Promise.all(dests!.map(async (d: any) => {
    try {
      const traffic = await getTrafficData(d.origin, d.destination, settings.google_maps_api_key);
      return { ...d, traffic };
    } catch {
      return { ...d, traffic: null, error: 'API-Fehler' };
    }
  }));

  res.json(results);
});

// GET /api/traffic/destinations – Liste für Settings
router.get('/destinations', authenticate, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  try {
    const dests = db.prepare('SELECT * FROM traffic_destinations ORDER BY sort_order').all();
    res.json(dests);
  } finally {
    db.close();
  }
});

// POST /api/traffic/destinations
router.post('/destinations', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const { name, origin, destination, icon, sort_order } = req.body;
  if (!name || !origin || !destination) {
    res.status(400).json({ error: 'name, origin, destination erforderlich' });
    return;
  }
  const id = crypto.randomUUID();
  const db = getDatabase();
  try {
    db.prepare(`INSERT INTO traffic_destinations (id, name, origin, destination, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, name, origin, destination, icon ?? '📍', sort_order ?? 99);
    const dest = db.prepare('SELECT * FROM traffic_destinations WHERE id=?').get(id);
    res.json(dest);
  } finally {
    db.close();
  }
});

// PUT /api/traffic/destinations/:id
router.put('/destinations/:id', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const { name, origin, destination, icon, sort_order } = req.body;
  const active = req.body.active !== undefined ? (req.body.active ? 1 : 0) : undefined;
  const db = getDatabase();
  try {
    if (active !== undefined) {
      db.prepare(`UPDATE traffic_destinations SET name=?, origin=?, destination=?, icon=?, sort_order=?, active=? WHERE id=?`)
        .run(name, origin, destination, icon ?? '📍', sort_order ?? 99, active, req.params.id);
    } else {
      db.prepare(`UPDATE traffic_destinations SET name=?, origin=?, destination=?, icon=?, sort_order=? WHERE id=?`)
        .run(name, origin, destination, icon ?? '📍', sort_order ?? 99, req.params.id);
    }
    const dest = db.prepare('SELECT * FROM traffic_destinations WHERE id=?').get(req.params.id);
    res.json(dest);
  } finally {
    db.close();
  }
});

// DELETE /api/traffic/destinations/:id
router.delete('/destinations/:id', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  try {
    db.prepare('DELETE FROM traffic_destinations WHERE id=?').run(req.params.id);
  } finally {
    db.close();
  }
  res.sendStatus(204);
});

export default router;

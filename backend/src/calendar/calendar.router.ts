import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import ical from 'node-ical';
import { getDatabase } from '../database/schema';
import { authenticate, requireParent, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  const { start, end, userId } = req.query;
  const db = getDatabase();
  let query = 'SELECT ce.*, u.name as user_name, u.color as user_color FROM calendar_events ce LEFT JOIN users u ON ce.user_id=u.id WHERE 1=1';
  const params: any[] = [];
  if (start) { query += ' AND ce.end_time >= ?'; params.push(start); }
  if (end) { query += ' AND ce.start_time <= ?'; params.push(end); }
  if (userId) { query += ' AND ce.user_id = ?'; params.push(userId); }
  query += ' ORDER BY ce.start_time';
  const events = db.prepare(query).all(...params);
  db.close();
  res.json(events);
});

router.post('/', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const { title, description, start_time, end_time, all_day, category, user_id, recurrence_rule, color } = req.body;
  if (!title || !start_time || !end_time) {
    res.status(400).json({ error: 'Titel, Start- und Endzeit erforderlich' });
    return;
  }
  const id = uuidv4();
  const db = getDatabase();
  db.prepare('INSERT INTO calendar_events (id, title, description, start_time, end_time, all_day, category, user_id, recurrence_rule, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, title, description || null, start_time, end_time, all_day ? 1 : 0, category || 'general', user_id || null, recurrence_rule || null, color || null);
  db.close();
  res.status(201).json({ id });
});

router.put('/:id', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const { title, description, start_time, end_time, all_day, category, user_id, recurrence_rule, color } = req.body;
  const db = getDatabase();
  db.prepare('UPDATE calendar_events SET title=?, description=?, start_time=?, end_time=?, all_day=?, category=?, user_id=?, recurrence_rule=?, color=?, updated_at=datetime("now") WHERE id=?')
    .run(title, description || null, start_time, end_time, all_day ? 1 : 0, category || 'general', user_id || null, recurrence_rule || null, color || null, req.params.id);
  db.close();
  res.json({ success: true });
});

router.delete('/:id', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  db.prepare('DELETE FROM calendar_events WHERE id = ?').run(req.params.id);
  db.close();
  res.json({ success: true });
});

router.post('/sync-google', authenticate, requireParent, async (req: AuthRequest, res: Response) => {
  const { icalUrl } = req.body;
  if (!icalUrl) { res.status(400).json({ error: 'iCal URL erforderlich' }); return; }
  try {
    const { data } = await axios.get(icalUrl, { timeout: 10000 });
    const parsed = ical.parseICS(data);
    const db = getDatabase();
    let imported = 0;
    for (const [, event] of Object.entries(parsed)) {
      if (event.type !== 'VEVENT') continue;
      const existing = db.prepare('SELECT id FROM calendar_events WHERE google_event_id = ?').get(event.uid);
      if (existing) continue;
      db.prepare('INSERT INTO calendar_events (id, title, description, start_time, end_time, all_day, category, google_event_id, calendar_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), event.summary || 'Kein Titel', event.description || null,
          (event.start as Date).toISOString(), (event.end as Date).toISOString(),
          0, 'general', event.uid, 'google');
      imported++;
    }
    db.close();
    res.json({ imported });
  } catch (e: any) {
    res.status(500).json({ error: 'Synchronisation fehlgeschlagen: ' + e.message });
  }
});

export default router;

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/schema';
import { authenticate, requireParent, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/:userId', authenticate, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'parent' && req.user!.id !== req.params.userId) {
    res.status(403).json({ error: 'Kein Zugriff' }); return;
  }
  const db = getDatabase();
  const entries = db.prepare('SELECT * FROM timetable_entries WHERE user_id=? ORDER BY day_of_week, period').all(req.params.userId);
  db.close();
  res.json(entries);
});

router.post('/:userId', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const { day_of_week, period, subject, teacher, room, start_time, end_time } = req.body;
  if (!day_of_week || !period || !subject) {
    res.status(400).json({ error: 'Wochentag, Stunde und Fach erforderlich' }); return;
  }
  const id = uuidv4();
  const db = getDatabase();
  db.prepare('INSERT INTO timetable_entries (id, user_id, day_of_week, period, subject, teacher, room, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.params.userId, day_of_week, period, subject, teacher || null, room || null, start_time || null, end_time || null);
  db.close();
  res.status(201).json({ id });
});

router.put('/:entryId', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const { subject, teacher, room, start_time, end_time, is_cancelled, substitute_teacher, note } = req.body;
  const db = getDatabase();
  db.prepare('UPDATE timetable_entries SET subject=?, teacher=?, room=?, start_time=?, end_time=?, is_cancelled=?, substitute_teacher=?, note=? WHERE id=?')
    .run(subject, teacher || null, room || null, start_time || null, end_time || null, is_cancelled ? 1 : 0, substitute_teacher || null, note || null, req.params.entryId);
  db.close();
  res.json({ success: true });
});

router.delete('/:entryId', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  db.prepare('DELETE FROM timetable_entries WHERE id=?').run(req.params.entryId);
  db.close();
  res.json({ success: true });
});

export default router;

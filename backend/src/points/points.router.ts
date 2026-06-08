import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/schema';
import { authenticate, requireParent, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/award', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const { user_id, points, reason } = req.body;
  if (!user_id || !points || !reason) {
    res.status(400).json({ error: 'Benutzer, Punkte und Grund erforderlich' });
    return;
  }
  const db = getDatabase();
  db.prepare('INSERT INTO point_transactions (id, user_id, points, reason, created_by) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), user_id, points, reason, req.user!.id);
  db.close();
  res.status(201).json({ success: true });
});

router.get('/leaderboard', authenticate, (_req, res: Response) => {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT u.id, u.name, u.color, u.avatar, COALESCE(SUM(pt.points),0) as total_points
    FROM users u
    LEFT JOIN point_transactions pt ON pt.user_id=u.id
    WHERE u.role='child'
    GROUP BY u.id ORDER BY total_points DESC
  `).all();
  db.close();
  res.json(rows);
});

router.get('/rewards', authenticate, (_req, res: Response) => {
  const db = getDatabase();
  const rewards = db.prepare('SELECT * FROM rewards WHERE active=1 ORDER BY points_required').all();
  db.close();
  res.json(rewards);
});

router.post('/rewards', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const { title, description, points_required, icon } = req.body;
  if (!title || !points_required) { res.status(400).json({ error: 'Titel und Punkte erforderlich' }); return; }
  const id = uuidv4();
  const db = getDatabase();
  db.prepare('INSERT INTO rewards (id, title, description, points_required, icon) VALUES (?, ?, ?, ?, ?)')
    .run(id, title, description || null, points_required, icon || 'star');
  db.close();
  res.status(201).json({ id });
});

router.post('/redeem/:rewardId', authenticate, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const reward = db.prepare('SELECT * FROM rewards WHERE id=? AND active=1').get(req.params.rewardId) as any;
  if (!reward) { db.close(); res.status(404).json({ error: 'Belohnung nicht gefunden' }); return; }
  const total = (db.prepare('SELECT COALESCE(SUM(points),0) as t FROM point_transactions WHERE user_id=?').get(req.user!.id) as any).t;
  if (total < reward.points_required) {
    db.close();
    res.status(400).json({ error: `Nicht genug Punkte. Benötigt: ${reward.points_required}, Vorhanden: ${total}` });
    return;
  }
  const id = uuidv4();
  db.prepare('INSERT INTO reward_redemptions (id, reward_id, user_id, points_spent) VALUES (?, ?, ?, ?)').run(id, reward.id, req.user!.id, reward.points_required);
  db.prepare('INSERT INTO point_transactions (id, user_id, points, reason, created_by) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), req.user!.id, -reward.points_required, `Belohnung eingelöst: ${reward.title}`, req.user!.id);
  db.close();
  res.status(201).json({ id });
});

router.get('/allowance/:userId', authenticate, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'parent' && req.user!.id !== req.params.userId) {
    res.status(403).json({ error: 'Kein Zugriff' }); return;
  }
  const db = getDatabase();
  const history = db.prepare('SELECT * FROM allowance_history WHERE user_id=? ORDER BY month DESC').all(req.params.userId);
  db.close();
  res.json(history);
});

router.post('/allowance/calculate', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const settings = db.prepare('SELECT points_to_euro_rate FROM settings WHERE id=1').get() as any;
  const rate = settings?.points_to_euro_rate || 0.01;
  const month = new Date().toISOString().slice(0, 7);
  const children = db.prepare('SELECT * FROM users WHERE role=?').all('child') as any[];
  const results: any[] = [];
  for (const child of children) {
    const points = (db.prepare('SELECT COALESCE(SUM(points),0) as t FROM point_transactions WHERE user_id=? AND strftime("%Y-%m", created_at)=?').get(child.id, month) as any).t;
    const amount = points * rate;
    const existing = db.prepare('SELECT id FROM allowance_history WHERE user_id=? AND month=?').get(child.id, month);
    if (!existing) {
      db.prepare('INSERT INTO allowance_history (id, user_id, month, points_total, amount_eur) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), child.id, month, points, amount);
    }
    results.push({ userId: child.id, name: child.name, month, points, amount });
  }
  db.close();
  res.json(results);
});

export default router;

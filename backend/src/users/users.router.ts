import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/schema';
import { authenticate, requireParent, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (_req, res: Response) => {
  const db = getDatabase();
  const users = db.prepare('SELECT id, name, email, role, color, avatar, birth_date, allowance_rate FROM users ORDER BY role, name').all();
  db.close();
  res.json(users);
});

router.post('/', authenticate, requireParent, async (req: AuthRequest, res: Response) => {
  const { name, email, password, role, color, birth_date, allowance_rate } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ error: 'Name, E-Mail, Passwort und Rolle erforderlich' });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  const db = getDatabase();
  try {
    db.prepare('INSERT INTO users (id, name, email, password_hash, role, color, birth_date, allowance_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, email, hash, role, color || '#1976d2', birth_date || null, allowance_rate || 0);
    res.status(201).json({ id, name, email, role, color: color || '#1976d2' });
  } catch (e: any) {
    res.status(409).json({ error: 'E-Mail bereits vergeben' });
  } finally {
    db.close();
  }
});

router.put('/:id', authenticate, requireParent, async (req: AuthRequest, res: Response) => {
  const { name, color, birth_date, allowance_rate, password } = req.body;
  const db = getDatabase();
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    db.prepare('UPDATE users SET name=?, color=?, birth_date=?, allowance_rate=?, password_hash=?, updated_at=datetime("now") WHERE id=?')
      .run(name, color, birth_date, allowance_rate, hash, req.params.id);
  } else {
    db.prepare('UPDATE users SET name=?, color=?, birth_date=?, allowance_rate=?, updated_at=datetime("now") WHERE id=?')
      .run(name, color, birth_date, allowance_rate, req.params.id);
  }
  db.close();
  res.json({ success: true });
});

router.delete('/:id', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  db.close();
  res.json({ success: true });
});

router.get('/:id/points', authenticate, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const total = (db.prepare('SELECT COALESCE(SUM(points),0) as total FROM point_transactions WHERE user_id=?').get(req.params.id) as any).total;
  const transactions = db.prepare('SELECT pt.*, u.name as created_by_name FROM point_transactions pt LEFT JOIN users u ON pt.created_by=u.id WHERE pt.user_id=? ORDER BY pt.created_at DESC LIMIT 50').all(req.params.id);
  db.close();
  res.json({ total, transactions });
});

export default router;

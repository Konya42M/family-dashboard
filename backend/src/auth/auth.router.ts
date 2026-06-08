import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/schema';
import { signToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'E-Mail und Passwort erforderlich' });
    return;
  }
  const db = getDatabase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  db.close();
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    return;
  }
  const token = signToken({ id: user.id, role: user.role, email: user.email });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, color: user.color, avatar: user.avatar } });
});

router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const user = db.prepare('SELECT id, name, email, role, color, avatar, birth_date FROM users WHERE id = ?').get(req.user!.id) as any;
  db.close();
  if (!user) { res.status(404).json({ error: 'Benutzer nicht gefunden' }); return; }
  res.json(user);
});

export default router;

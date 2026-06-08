import { Router, Response } from 'express';
import webpush from 'web-push';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails('mailto:admin@familie.local', VAPID_PUBLIC, VAPID_PRIVATE);
}

router.get('/vapid-public-key', (_req, res: Response) => {
  res.json({ key: VAPID_PUBLIC });
});

router.post('/subscribe', authenticate, (req: AuthRequest, res: Response) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: 'Ungültige Subscription' }); return;
  }
  const db = getDatabase();
  try {
    const existing = db.prepare('SELECT id FROM push_subscriptions WHERE endpoint=?').get(endpoint);
    if (!existing) {
      db.prepare('INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), req.user!.id, endpoint, keys.p256dh, keys.auth);
    }
    res.json({ success: true });
  } finally {
    db.close();
  }
});

router.post('/unsubscribe', authenticate, (req: AuthRequest, res: Response) => {
  const { endpoint } = req.body;
  const db = getDatabase();
  db.prepare('DELETE FROM push_subscriptions WHERE endpoint=? AND user_id=?').run(endpoint, req.user!.id);
  db.close();
  res.json({ success: true });
});

export async function sendNotificationToParents(title: string, body: string, url = '/') {
  const db = getDatabase();
  const parents = db.prepare(`
    SELECT ps.endpoint, ps.p256dh, ps.auth FROM push_subscriptions ps
    JOIN users u ON ps.user_id=u.id WHERE u.role='parent'
  `).all() as any[];
  db.close();

  const payload = JSON.stringify({ title, body, url });
  for (const sub of parents) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
    } catch (e) {
      console.error('Push failed:', e);
    }
  }
}

export async function sendNotificationToUser(userId: string, title: string, body: string, url = '/') {
  const db = getDatabase();
  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id=?').all(userId) as any[];
  db.close();

  const payload = JSON.stringify({ title, body, url });
  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
    } catch (e) {
      console.error('Push failed:', e);
    }
  }
}

export default router;

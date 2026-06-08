import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { authenticate, requireParent, AuthRequest } from '../middleware/auth';

const router = Router();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/family.db');

router.get('/download', authenticate, requireParent, (_req: AuthRequest, res: Response) => {
  if (!fs.existsSync(DB_PATH)) {
    res.status(404).json({ error: 'Datenbank nicht gefunden' }); return;
  }
  const filename = `family-dashboard-backup-${new Date().toISOString().split('T')[0]}.zip`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/zip');

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);
  archive.file(DB_PATH, { name: 'family.db' });
  archive.finalize();
});

router.post('/restore', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  res.json({ message: 'Restore über CLI: cp backup.db data/family.db && docker-compose restart backend' });
});

export default router;

import { Router, Response } from 'express';
import axios from 'axios';
import { getDatabase } from '../database/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

let prayerCache: { data: any; date: string; cityId: string } | null = null;

router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const settings = db.prepare('SELECT prayer_city_id FROM settings WHERE id=1').get() as any;
  db.close();

  const cityId = settings?.prayer_city_id || '9541';
  const today = new Date().toISOString().split('T')[0];

  if (prayerCache?.date === today && prayerCache?.cityId === cityId) {
    res.json(prayerCache.data);
    return;
  }

  try {
    const { data } = await axios.get(`https://ezanvakti.emushaf.net/vakitler/${cityId}`, { timeout: 8000 });
    const todayStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\./g, '.');
    const todayEntry = Array.isArray(data) ? data.find((d: any) => d.MiladiTarihKisa === todayStr) || data[0] : data;

    const prayers = {
      fajr: todayEntry?.Imsak || todayEntry?.imsak || '',
      sunrise: todayEntry?.Gunes || todayEntry?.gunes || '',
      dhuhr: todayEntry?.Ogle || todayEntry?.ogle || '',
      asr: todayEntry?.Ikindi || todayEntry?.ikindi || '',
      maghrib: todayEntry?.Aksam || todayEntry?.aksam || '',
      isha: todayEntry?.Yatsi || todayEntry?.yatsi || '',
      date: today,
      cityId,
    };

    prayerCache = { data: prayers, date: today, cityId };
    res.json(prayers);
  } catch (e: any) {
    res.status(503).json({ error: 'Gebetszeiten konnten nicht geladen werden', detail: e.message });
  }
});

router.get('/cities', authenticate, async (req: AuthRequest, res: Response) => {
  const { q } = req.query;
  try {
    const { data } = await axios.get(`https://ezanvakti.emushaf.net/sehirler/2`, { timeout: 8000 });
    if (q) {
      const filtered = data.filter((c: any) =>
        c.SehirAdi?.toLowerCase().includes((q as string).toLowerCase()) ||
        c.SehirAdiEn?.toLowerCase().includes((q as string).toLowerCase())
      );
      res.json(filtered.slice(0, 20));
    } else {
      res.json(data);
    }
  } catch (e: any) {
    res.status(503).json({ error: 'Städte konnten nicht geladen werden' });
  }
});

export default router;

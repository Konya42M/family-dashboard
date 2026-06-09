import { Router, Response } from 'express';
import axios from 'axios';
import { getDatabase } from '../database/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

let prayerCache: { data: any; date: string; cityId: string } | null = null;

function normalizePrayers(entry: any, cityId: string): object {
  return {
    fajr:    entry?.Imsak   || entry?.imsak   || '',
    sunrise: entry?.Gunes   || entry?.gunes   || '',
    dhuhr:   entry?.Ogle    || entry?.ogle    || '',
    asr:     entry?.Ikindi  || entry?.ikindi  || '',
    maghrib: entry?.Aksam   || entry?.aksam   || '',
    isha:    entry?.Yatsi   || entry?.yatsi   || '',
    date:    new Date().toISOString().split('T')[0],
    cityId,
  };
}

router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const settings = db.prepare('SELECT prayer_city_id FROM settings WHERE id=1').get() as any;
  db.close();

  const cityId = settings?.prayer_city_id || '11027'; // Stuttgart default
  const today = new Date().toISOString().split('T')[0];

  if (prayerCache?.date === today && prayerCache?.cityId === cityId) {
    res.json(prayerCache.data);
    return;
  }

  try {
    const { data } = await axios.get(`https://ezanvakti.emushaf.net/vakitler/${cityId}`, { timeout: 10000 });
    if (!Array.isArray(data) || data.length === 0) throw new Error('Keine Daten');

    // Format: MiladiTarihKisa is "09.06.2026" (DD.MM.YYYY)
    const todayFormatted = new Date().toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).replace(/\//g, '.');

    const todayEntry = data.find((d: any) => {
      const dateStr = d.MiladiTarihKisa || d.MiladiTarihKisaIso8601?.slice(0, 10) || '';
      // normalize both formats: "09.06.2026" or "2026-06-09"
      const normalized = dateStr.includes('-')
        ? new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')
        : dateStr;
      return normalized === todayFormatted;
    }) || data[0];

    const prayers = normalizePrayers(todayEntry, cityId);
    prayerCache = { data: prayers, date: today, cityId };
    res.json(prayers);
  } catch (e: any) {
    res.status(503).json({ error: 'Gebetszeiten nicht verfügbar', detail: e.message });
  }
});

router.get('/cities', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    // Germany = UlkeID 13, returns Bundesländer
    const { data } = await axios.get('https://ezanvakti.emushaf.net/sehirler/13', { timeout: 8000 });
    res.json(data);
  } catch {
    res.status(503).json({ error: 'Städte konnten nicht geladen werden' });
  }
});

router.get('/districts/:sehirId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { data } = await axios.get(`https://ezanvakti.emushaf.net/ilceler/${req.params.sehirId}`, { timeout: 8000 });
    res.json(data);
  } catch {
    res.status(503).json({ error: 'Bezirke konnten nicht geladen werden' });
  }
});

export default router;


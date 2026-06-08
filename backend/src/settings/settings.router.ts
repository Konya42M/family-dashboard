import { Router, Response } from 'express';
import { getDatabase } from '../database/schema';
import { authenticate, requireParent, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (_req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const settings = db.prepare('SELECT id, prayer_city_id, prayer_country_code, dad_work_address, mom_work_address, dad_work_origin, mom_work_origin, vvs_stop_id, vvs_stop_name, points_to_euro_rate, dark_mode, family_name FROM settings WHERE id=1').get();
  db.close();
  res.json(settings || {});
});

router.put('/', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const { prayer_city_id, prayer_country_code, dad_work_address, mom_work_address, dad_work_origin, mom_work_origin, google_maps_api_key, vvs_stop_id, vvs_stop_name, points_to_euro_rate, dark_mode, family_name } = req.body;
  const db = getDatabase();
  db.prepare(`UPDATE settings SET
    prayer_city_id=?, prayer_country_code=?, dad_work_address=?, mom_work_address=?,
    dad_work_origin=?, mom_work_origin=?, google_maps_api_key=COALESCE(?, google_maps_api_key),
    vvs_stop_id=?, vvs_stop_name=?, points_to_euro_rate=?, dark_mode=?, family_name=?,
    updated_at=datetime("now") WHERE id=1`)
    .run(prayer_city_id, prayer_country_code, dad_work_address, mom_work_address,
      dad_work_origin, mom_work_origin, google_maps_api_key || null,
      vvs_stop_id, vvs_stop_name, points_to_euro_rate, dark_mode ? 1 : 0, family_name);
  db.close();
  res.json({ success: true });
});

export default router;

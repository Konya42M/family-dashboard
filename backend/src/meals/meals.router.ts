import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/schema';
import { authenticate, requireParent, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  const { start, end } = req.query;
  const db = getDatabase();
  let query = 'SELECT * FROM meal_plans WHERE 1=1';
  const params: any[] = [];
  if (start) { query += ' AND date >= ?'; params.push(start); }
  if (end) { query += ' AND date <= ?'; params.push(end); }
  query += ' ORDER BY date, meal_type';
  const meals = db.prepare(query).all(...params);
  db.close();
  res.json(meals);
});

router.put('/:date/:mealType', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const { title, description, recipe } = req.body;
  const { date, mealType } = req.params;
  if (!title) { res.status(400).json({ error: 'Titel erforderlich' }); return; }
  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM meal_plans WHERE date=? AND meal_type=?').get(date, mealType);
  if (existing) {
    db.prepare('UPDATE meal_plans SET title=?, description=?, recipe=?, updated_at=datetime("now") WHERE date=? AND meal_type=?')
      .run(title, description || null, recipe || null, date, mealType);
  } else {
    db.prepare('INSERT INTO meal_plans (id, date, meal_type, title, description, recipe, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), date, mealType, title, description || null, recipe || null, req.user!.id);
  }
  db.close();
  res.json({ success: true });
});

router.delete('/:date/:mealType', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  db.prepare('DELETE FROM meal_plans WHERE date=? AND meal_type=?').run(req.params.date, req.params.mealType);
  db.close();
  res.json({ success: true });
});

router.get('/shopping-list', authenticate, (_req, res: Response) => {
  const db = getDatabase();
  const items = db.prepare('SELECT si.*, mp.date, mp.meal_type, mp.title as meal_title FROM shopping_items si JOIN meal_plans mp ON si.meal_plan_id=mp.id ORDER BY si.category, si.name').all();
  db.close();
  res.json(items);
});

router.post('/shopping-items', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const { name, quantity, category, meal_plan_id } = req.body;
  if (!name) { res.status(400).json({ error: 'Name erforderlich' }); return; }
  const id = uuidv4();
  const db = getDatabase();
  db.prepare('INSERT INTO shopping_items (id, name, quantity, category, meal_plan_id) VALUES (?, ?, ?, ?, ?)').run(id, name, quantity || null, category || null, meal_plan_id || null);
  db.close();
  res.status(201).json({ id });
});

router.put('/shopping-items/:id/check', authenticate, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  db.prepare('UPDATE shopping_items SET checked=? WHERE id=?').run(req.body.checked ? 1 : 0, req.params.id);
  db.close();
  res.json({ success: true });
});

export default router;

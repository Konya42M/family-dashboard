import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/schema';
import { authenticate, requireParent, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  const isParent = req.user!.role === 'parent';
  const query = isParent
    ? `SELECT t.*, u1.name as assigned_name, u1.color as assigned_color, u2.name as created_by_name FROM todos t LEFT JOIN users u1 ON t.assigned_to=u1.id LEFT JOIN users u2 ON t.created_by=u2.id ORDER BY t.priority DESC, t.due_date`
    : `SELECT t.*, u1.name as assigned_name, u1.color as assigned_color, u2.name as created_by_name FROM todos t LEFT JOIN users u1 ON t.assigned_to=u1.id LEFT JOIN users u2 ON t.created_by=u2.id WHERE t.assigned_to=? ORDER BY t.priority DESC, t.due_date`;
  const todos = isParent ? db.prepare(query).all() : db.prepare(query).all(req.user!.id);
  db.close();
  res.json(todos);
});

router.post('/', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const { title, description, due_date, assigned_to, priority, points } = req.body;
  if (!title) { res.status(400).json({ error: 'Titel erforderlich' }); return; }
  const id = uuidv4();
  const db = getDatabase();
  db.prepare('INSERT INTO todos (id, title, description, due_date, assigned_to, created_by, priority, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, title, description || null, due_date || null, assigned_to || null, req.user!.id, priority || 'medium', points || 0);
  db.close();
  res.status(201).json({ id });
});

router.put('/:id', authenticate, (req: AuthRequest, res: Response) => {
  const { title, description, due_date, assigned_to, priority, status, points } = req.body;
  const db = getDatabase();
  const todo = db.prepare('SELECT * FROM todos WHERE id=?').get(req.params.id) as any;
  if (!todo) { db.close(); res.status(404).json({ error: 'Nicht gefunden' }); return; }

  if (req.user!.role === 'child' && status && todo.assigned_to === req.user!.id) {
    db.prepare('UPDATE todos SET status=?, updated_at=datetime("now") WHERE id=?').run(status, req.params.id);
    if (status === 'done' && todo.points > 0) {
      db.prepare('INSERT INTO point_transactions (id, user_id, points, reason, todo_id, created_by) VALUES (?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), req.user!.id, todo.points, `Aufgabe erledigt: ${todo.title}`, todo.id, req.user!.id);
    }
    db.close();
    res.json({ success: true });
    return;
  }

  if (req.user!.role !== 'parent') { db.close(); res.status(403).json({ error: 'Kein Zugriff' }); return; }
  db.prepare('UPDATE todos SET title=?, description=?, due_date=?, assigned_to=?, priority=?, status=?, points=?, updated_at=datetime("now") WHERE id=?')
    .run(title, description || null, due_date || null, assigned_to || null, priority || 'medium', status || todo.status, points || 0, req.params.id);
  db.close();
  res.json({ success: true });
});

router.delete('/:id', authenticate, requireParent, (req: AuthRequest, res: Response) => {
  const db = getDatabase();
  db.prepare('DELETE FROM todos WHERE id=?').run(req.params.id);
  db.close();
  res.json({ success: true });
});

export default router;

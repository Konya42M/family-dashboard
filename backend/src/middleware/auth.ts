import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string };
}

const JWT_SECRET = process.env.JWT_SECRET || 'family-dashboard-secret-change-in-production';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Nicht autorisiert' });
    return;
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET) as { id: string; role: string; email: string };
    next();
  } catch {
    res.status(401).json({ error: 'Token ungültig' });
  }
}

export function requireParent(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'parent') {
    res.status(403).json({ error: 'Nur Eltern haben Zugriff' });
    return;
  }
  next();
}

export function signToken(payload: { id: string; role: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

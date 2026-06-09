import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeDatabase, getDatabase } from './database/schema';
import authRouter from './auth/auth.router';
import usersRouter from './users/users.router';
import calendarRouter from './calendar/calendar.router';
import todosRouter from './todos/todos.router';
import mealsRouter from './meals/meals.router';
import timetableRouter from './timetable/timetable.router';
import prayersRouter from './prayers/prayers.router';
import trafficRouter from './traffic/traffic.router';
import transitRouter from './transit/transit.router';
import pointsRouter from './points/points.router';
import notificationsRouter from './notifications/notifications.router';
import settingsRouter from './settings/settings.router';
import backupRouter from './backup/backup.router';
import weatherRouter from './weather/weather.router';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize DB once at startup — keep connection open as singleton
const db = getDatabase();
initializeDatabase(db);
// DB stays open; each router calls getDatabase() which returns the same file-path connection

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/todos', todosRouter);
app.use('/api/meals', mealsRouter);
app.use('/api/timetable', timetableRouter);
app.use('/api/prayers', prayersRouter);
app.use('/api/traffic', trafficRouter);
app.use('/api/transit', transitRouter);
app.use('/api/points', pointsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/backup', backupRouter);
app.use('/api/weather', weatherRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Interner Serverfehler' });
});

app.listen(PORT, () => {
  console.log(`🏠 Family Dashboard Backend läuft auf Port ${PORT}`);
});

export default app;


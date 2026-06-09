import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/family.db');

export function getDatabase(): Database.Database {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function initializeDatabase(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('parent','child')),
      color TEXT NOT NULL DEFAULT '#1976d2',
      avatar TEXT,
      birth_date TEXT,
      allowance_rate REAL DEFAULT 0,
      push_subscription TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      prayer_city_id TEXT DEFAULT '9541',
      prayer_country_code TEXT DEFAULT 'TR',
      dad_work_address TEXT,
      mom_work_address TEXT,
      dad_work_origin TEXT,
      mom_work_origin TEXT,
      google_maps_api_key TEXT,
      vvs_stop_id TEXT DEFAULT '5006118',
      vvs_stop_name TEXT DEFAULT 'Hauptbahnhof',
      points_to_euro_rate REAL DEFAULT 0.01,
      dark_mode INTEGER DEFAULT 0,
      family_name TEXT DEFAULT 'Familie',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      all_day INTEGER DEFAULT 0,
      category TEXT DEFAULT 'general',
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      recurrence_rule TEXT,
      google_event_id TEXT,
      calendar_source TEXT DEFAULT 'internal',
      color TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
      status TEXT DEFAULT 'open' CHECK(status IN ('open','in_progress','pending_approval','done')),
      points INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS timetable_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 5),
      period INTEGER NOT NULL,
      subject TEXT NOT NULL,
      teacher TEXT,
      room TEXT,
      start_time TEXT,
      end_time TEXT,
      is_cancelled INTEGER DEFAULT 0,
      substitute_teacher TEXT,
      note TEXT,
      valid_from TEXT,
      valid_until TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast','lunch','dinner')),
      title TEXT NOT NULL,
      description TEXT,
      recipe TEXT,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(date, meal_type)
    );

    CREATE TABLE IF NOT EXISTS shopping_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      quantity TEXT,
      category TEXT,
      checked INTEGER DEFAULT 0,
      meal_plan_id TEXT REFERENCES meal_plans(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS point_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      points INTEGER NOT NULL,
      reason TEXT NOT NULL,
      todo_id TEXT REFERENCES todos(id) ON DELETE SET NULL,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      points_required INTEGER NOT NULL,
      icon TEXT DEFAULT 'star',
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reward_redemptions (
      id TEXT PRIMARY KEY,
      reward_id TEXT NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      points_spent INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS allowance_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      points_total INTEGER NOT NULL,
      amount_eur REAL NOT NULL,
      paid INTEGER DEFAULT 0,
      paid_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO settings (id) VALUES (1);
  `);
}


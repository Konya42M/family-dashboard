import { getDatabase, initializeDatabase } from './schema';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  const db = getDatabase();
  initializeDatabase(db);

  const parentPw = await bcrypt.hash('family123', 10);
  const childPw = await bcrypt.hash('kind123', 10);

  const dadId = uuidv4();
  const momId = uuidv4();
  const child1Id = uuidv4();
  const child2Id = uuidv4();

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, password_hash, role, color, birth_date, allowance_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(dadId, 'Papa', 'papa@familie.local', parentPw, 'parent', '#1565c0', '1985-03-15', 0);
  insertUser.run(momId, 'Mama', 'mama@familie.local', parentPw, 'parent', '#ad1457', '1988-07-22', 0);
  insertUser.run(child1Id, 'Yusuf', 'yusuf@familie.local', childPw, 'child', '#2e7d32', '2013-05-10', 0.01);
  insertUser.run(child2Id, 'Aysha', 'aysha@familie.local', childPw, 'child', '#e65100', '2016-09-03', 0.01);

  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO calendar_events (id, title, start_time, end_time, all_day, category, user_id, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const fmt = (d: Date) => d.toISOString();

  const ev1Start = new Date(today); ev1Start.setDate(today.getDate() + 2); ev1Start.setHours(10, 0, 0, 0);
  const ev1End = new Date(ev1Start); ev1End.setHours(11, 0, 0, 0);
  insertEvent.run(uuidv4(), 'Zahnarzt Yusuf', fmt(ev1Start), fmt(ev1End), 0, 'appointment', child1Id, '#2e7d32');

  const ev2Start = new Date(today); ev2Start.setDate(today.getDate() + 5); ev2Start.setHours(9, 0, 0, 0);
  const ev2End = new Date(ev2Start); ev2End.setHours(17, 0, 0, 0);
  insertEvent.run(uuidv4(), 'Ausflug Schule', fmt(ev2Start), fmt(ev2End), 0, 'school', child1Id, '#1976d2');

  const insertTodo = db.prepare(`
    INSERT OR IGNORE INTO todos (id, title, description, assigned_to, created_by, priority, status, points)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTodo.run(uuidv4(), 'Zimmer aufräumen', 'Spielzeug wegräumen und Boden saugen', child1Id, dadId, 'medium', 'open', 10);
  insertTodo.run(uuidv4(), 'Hausaufgaben machen', 'Mathe S.45 und Deutsch Aufsatz', child1Id, momId, 'high', 'open', 20);
  insertTodo.run(uuidv4(), 'Müll rausbringen', 'Bio- und Restmüll', child2Id, dadId, 'low', 'open', 15);
  insertTodo.run(uuidv4(), 'Einkaufen', 'Milch, Brot, Obst', null, momId, 'medium', 'open', 0);

  const insertTimetable = db.prepare(`
    INSERT OR IGNORE INTO timetable_entries (id, user_id, day_of_week, period, subject, teacher, room, start_time, end_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const schedule = [
    [1, 1, 'Deutsch', 'Fr. Müller', 'R101', '07:45', '08:30'],
    [1, 2, 'Mathe', 'Hr. Schmidt', 'R102', '08:35', '09:20'],
    [1, 3, 'Englisch', 'Fr. Weber', 'R103', '09:40', '10:25'],
    [1, 4, 'Sport', 'Hr. Klein', 'Sporthalle', '10:30', '11:15'],
    [2, 1, 'Mathe', 'Hr. Schmidt', 'R102', '07:45', '08:30'],
    [2, 2, 'Biologie', 'Fr. Braun', 'R201', '08:35', '09:20'],
    [2, 3, 'Kunst', 'Fr. Hoffmann', 'R301', '09:40', '10:25'],
    [3, 1, 'Englisch', 'Fr. Weber', 'R103', '07:45', '08:30'],
    [3, 2, 'Geschichte', 'Hr. Fischer', 'R105', '08:35', '09:20'],
    [3, 3, 'Deutsch', 'Fr. Müller', 'R101', '09:40', '10:25'],
    [3, 4, 'Mathe', 'Hr. Schmidt', 'R102', '10:30', '11:15'],
    [4, 1, 'Physik', 'Hr. Wagner', 'R202', '07:45', '08:30'],
    [4, 2, 'Deutsch', 'Fr. Müller', 'R101', '08:35', '09:20'],
    [4, 3, 'Musik', 'Fr. Bauer', 'Musiksaal', '09:40', '10:25'],
    [5, 1, 'Mathe', 'Hr. Schmidt', 'R102', '07:45', '08:30'],
    [5, 2, 'Englisch', 'Fr. Weber', 'R103', '08:35', '09:20'],
    [5, 3, 'Religion', 'Hr. Huber', 'R106', '09:40', '10:25'],
  ];
  for (const [day, period, subject, teacher, room, start, end] of schedule) {
    insertTimetable.run(uuidv4(), child1Id, day, period, subject, teacher, room, start, end);
  }

  const insertMeal = db.prepare(`
    INSERT OR IGNORE INTO meal_plans (id, date, meal_type, title, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    insertMeal.run(uuidv4(), dateStr, 'breakfast', 'Haferflocken mit Früchten', 'Mit Banane und Beeren', momId);
    insertMeal.run(uuidv4(), dateStr, 'lunch', i % 2 === 0 ? 'Spaghetti Bolognese' : 'Gemüsesuppe', null, momId);
    insertMeal.run(uuidv4(), dateStr, 'dinner', i % 3 === 0 ? 'Köfte mit Reis' : 'Brot und Käse', null, momId);
  }

  const insertReward = db.prepare(`INSERT OR IGNORE INTO rewards (id, title, description, points_required, icon) VALUES (?, ?, ?, ?, ?)`);
  insertReward.run(uuidv4(), 'Eis essen', '1 Kugel Eis nach Wahl', 50, 'icecream');
  insertReward.run(uuidv4(), '1 Stunde extra Bildschirmzeit', 'Tablet oder TV', 100, 'tablet');
  insertReward.run(uuidv4(), 'Kinobesuch', 'Film nach Wahl', 300, 'movie');
  insertReward.run(uuidv4(), 'Spielzeug bis 10€', 'Kleines Spielzeug nach Wahl', 500, 'toys');

  const insertPoints = db.prepare(`INSERT OR IGNORE INTO point_transactions (id, user_id, points, reason, created_by) VALUES (?, ?, ?, ?, ?)`);
  insertPoints.run(uuidv4(), child1Id, 30, 'Starterbonus', dadId);
  insertPoints.run(uuidv4(), child2Id, 20, 'Starterbonus', dadId);

  console.log('✅ Seed-Daten erfolgreich eingefügt');
  console.log('👤 Papa: papa@familie.local / family123');
  console.log('👤 Mama: mama@familie.local / family123');
  console.log('👧 Yusuf: yusuf@familie.local / kind123');
  console.log('👧 Aysha: aysha@familie.local / kind123');
  db.close();
}

seed().catch(console.error);

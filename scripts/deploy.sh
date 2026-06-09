#!/bin/bash
# Family Dashboard Deploy Script
# Usage: ./scripts/deploy.sh
# Pulls latest code from GitHub and rebuilds all containers

set -e
cd "$(dirname "$0")/.."

echo "=== Family Dashboard Deploy ==="
echo "$(date)"

echo "→ Git pull..."
git pull origin main

echo "→ Docker Build Cache aufräumen (falls Speicher knapp)..."
AVAIL=$(df / | awk 'NR==2{print $4}')
if [ "$AVAIL" -lt 2000000 ]; then
  echo "  Wenig Speicher! Build-Cache bereinigen..."
  docker builder prune -f
fi

echo "→ Images neu bauen..."
docker compose build --no-cache

echo "→ Container neu starten..."
docker compose up -d

echo "→ Seed-Daten prüfen..."
sleep 3
USER_COUNT=$(docker exec family-dashboard-backend node -e "
const b=require('better-sqlite3');
const db=b('/data/family.db');
const r=db.prepare('SELECT count(*) as c FROM users').get();
console.log(r.c);
db.close();
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  echo "→ Seed-Daten einrichten..."
  docker exec family-dashboard-backend node -e "
const b=require('better-sqlite3');
const bcrypt=require('bcryptjs');
const uuid=require('uuid');
const db=b('/data/family.db');
const h1=bcrypt.hashSync('family123',10);
const h2=bcrypt.hashSync('kind123',10);
const ins=db.prepare('INSERT OR IGNORE INTO users (id,name,email,password_hash,role,color,birth_date,allowance_rate) VALUES (?,?,?,?,?,?,?,?)');
ins.run(uuid.v4(),'Papa','papa@familie.local',h1,'parent','#1565c0','1985-03-15',0);
ins.run(uuid.v4(),'Mama','mama@familie.local',h1,'parent','#ad1457','1988-07-22',0);
ins.run(uuid.v4(),'Yusuf','yusuf@familie.local',h2,'child','#2e7d32','2013-05-10',0.01);
ins.run(uuid.v4(),'Aysha','aysha@familie.local',h2,'child','#e65100','2016-09-03',0.01);
db.prepare('UPDATE settings SET prayer_city_id=?,family_name=? WHERE id=1').run('11027','Familie');
console.log('Seed OK');
db.close();
"
fi

echo ""
echo "✅ Deploy abgeschlossen!"
echo "   Backend:  http://$(hostname -I | awk '{print $1}'):3001/api/health"
echo "   Frontend: http://$(hostname -I | awk '{print $1}'):3000"


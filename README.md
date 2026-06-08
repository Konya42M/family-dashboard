# 🏠 Familien-Dashboard

Ein digitales Familien-Dashboard für Raspberry Pi 3 mit 7" Touchscreen — ähnlich wie Skylight Calendar oder Hearth Display, aber vollständig selbst gehostet.

## Features

| Feature | Beschreibung |
|---------|-------------|
| 🕐 Digitale Uhr | Uhrzeit, Datum, Wochentag |
| 🕌 Gebetszeiten | Islamische Gebetszeiten mit Countdown (ezanvakti API) |
| 🚗 Verkehr | Google Maps Echtzeit-Stauinfo für Papa & Mama |
| 🚋 ÖPNV | VVS/SSB Stuttgart Live-Abfahrten |
| 📅 Kalender | Monats-/Wochen-/Tagesansicht, Google Calendar Sync |
| 📚 Stundenplan | Stundenplan pro Kind mit Entfall/Vertretung |
| 🍽️ Mahlzeiten | Wochenplan Frühstück/Mittag/Abend + Einkaufsliste |
| ✅ ToDos | Aufgaben mit Priorität, Fälligkeit, Punkte |
| 🏆 Punktesystem | Gamification für Kinder mit Belohnungen |
| 💰 Taschengeld | Automatische Umrechnung Punkte → Euro |
| 📱 PWA | Installierbar auf Android & iPhone |
| 🔔 Push-Notifications | Web Push für Eltern |
| 🌙 Dark/Light Mode | Umschaltbar |

## Schnellstart

```bash
git clone https://github.com/youruser/family-dashboard.git
cd family-dashboard
cp .env.example .env
docker-compose up -d --build
docker exec family-dashboard-backend node dist/database/seed.js
```

Dann: http://localhost:3000

**Demo-Login:** `papa@familie.local` / `family123`

## Raspberry Pi Installation

```bash
chmod +x scripts/install-raspberry-pi.sh
./scripts/install-raspberry-pi.sh
sudo reboot
```

Vollständige Anleitung: [docs/INSTALLATION.md](docs/INSTALLATION.md)

## Tech Stack

**Backend:** Node.js · Express · TypeScript · SQLite (better-sqlite3)  
**Frontend:** React · TypeScript · Material UI · Vite · PWA  
**Deployment:** Docker Compose · nginx · systemd  
**APIs:** ezanvakti (Gebetszeiten) · Google Maps (Verkehr) · VVS EFA (ÖPNV)  

## Projektstruktur

```
family-dashboard/
├── backend/
│   └── src/
│       ├── auth/          # JWT Authentication
│       ├── users/         # Benutzerverwaltung
│       ├── calendar/      # Kalender + Google Cal Sync
│       ├── todos/         # ToDo System
│       ├── meals/         # Mahlzeitenplanung
│       ├── timetable/     # Stundenpläne
│       ├── points/        # Punkte + Belohnungen
│       ├── prayers/       # Gebetszeiten
│       ├── traffic/       # Verkehrsinfo
│       ├── transit/       # VVS Abfahrten
│       ├── notifications/ # Web Push
│       ├── settings/      # Einstellungen
│       ├── backup/        # Backup/Restore
│       └── database/      # Schema + Seed-Daten
├── frontend/
│   └── src/
│       ├── components/    # Wiederverwendbare Widgets
│       ├── pages/         # Seiten (Dashboard, Kalender, ...)
│       ├── contexts/      # Auth, Theme
│       ├── hooks/         # useInterval
│       ├── api/           # Axios Client
│       └── types/         # TypeScript Typen
├── docs/
│   ├── INSTALLATION.md
│   └── API.md
├── scripts/
│   ├── install-raspberry-pi.sh
│   └── backup.sh
└── docker-compose.yml
```

## API

Vollständige API-Dokumentation: [docs/API.md](docs/API.md)

## Lizenz

MIT License — kostenlos nutzbar, änderbar und weitergeben

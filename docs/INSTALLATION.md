# Familien-Dashboard - Installationsanleitung

## Raspberry Pi 3 (Empfohlen)

### Voraussetzungen
- Raspberry Pi 3 Model B/B+
- Raspberry Pi 7" Touch Display
- Raspberry Pi OS (Bullseye oder neuer)
- Internetverbindung

### Schnellinstallation

```bash
git clone https://github.com/youruser/family-dashboard.git ~/family-dashboard
cd ~/family-dashboard
chmod +x scripts/install-raspberry-pi.sh
./scripts/install-raspberry-pi.sh
sudo reboot
```

Nach dem Neustart startet das Dashboard automatisch im Kiosk-Modus.

---

## Docker Installation (lokaler PC / Server)

### Voraussetzungen
- Docker + Docker Compose
- Git

### Schritte

```bash
# 1. Repository klonen
git clone https://github.com/youruser/family-dashboard.git
cd family-dashboard

# 2. Umgebungsvariablen konfigurieren
cp .env.example .env
# .env bearbeiten und JWT_SECRET setzen

# 3. VAPID Keys für Push Notifications generieren (optional)
npx web-push generate-vapid-keys
# Keys in .env eintragen

# 4. Starten
docker-compose up -d --build

# 5. Demo-Daten laden
docker exec family-dashboard-backend node dist/database/seed.js

# 6. Browser öffnen
open http://localhost:3000
```

---

## Manuelle Installation (ohne Docker)

### Backend

```bash
cd backend
npm install
cp ../.env.example .env
# .env konfigurieren
npm run dev          # Entwicklung
npm run build && npm start  # Produktion
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # Entwicklung (Port 3000)
npm run build        # Produktion Build
```

---

## Konfiguration

Nach der Installation über das Web-Interface unter **Einstellungen** konfigurieren:

### Gebetszeiten
- Stadt-ID von [ezanvakti.emushaf.net](https://ezanvakti.emushaf.net) - Städteliste: `/sehirler/2`
- Standard: `9541` (Stuttgart)

### Verkehr
- Google Maps Distance Matrix API Key erforderlich
- [Google Cloud Console](https://console.cloud.google.com) → APIs → Distance Matrix API aktivieren
- Heimat- und Arbeitsadressen für Mama und Papa eingeben

### VVS Abfahrten
- Haltestellen-ID aus dem VVS EFA-System
- Standard: `5006118` (Stuttgart Hauptbahnhof)
- Andere Haltestellen: VVS EFA-Auskunft nutzen

---

## Zugänge (Demo-Daten)

| Name  | E-Mail                | Passwort  | Rolle     |
|-------|-----------------------|-----------|-----------|
| Papa  | papa@familie.local    | family123 | Elternteil |
| Mama  | mama@familie.local    | family123 | Elternteil |
| Yusuf | yusuf@familie.local   | kind123   | Kind      |
| Aysha | aysha@familie.local   | kind123   | Kind      |

**Passwörter nach der Installation unbedingt ändern!**

---

## Backup & Restore

### Backup
```bash
# Manuell
scripts/backup.sh

# Oder über Web-Interface: Einstellungen → Backup

# Automatisches Backup einrichten (täglich 3 Uhr)
(crontab -l 2>/dev/null; echo "0 3 * * * /home/$USER/family-dashboard/scripts/backup.sh") | crontab -
```

### Restore
```bash
docker-compose stop backend
cp backup/family_DATUM.db data/family.db
docker-compose start backend
```

---

## PWA Installation (Smartphone)

### Android (Chrome)
1. Dashboard im Browser öffnen
2. Dreipunkt-Menü → "Zum Startbildschirm hinzufügen"
3. App öffnet sich dann wie eine native App

### iPhone (Safari)
1. Dashboard in Safari öffnen
2. Teilen-Symbol → "Zum Home-Bildschirm"

---

## Kiosk-Modus manuell testen

```bash
# Kiosk starten
~/family-dashboard/scripts/start-kiosk.sh

# Beenden: Alt+F4 oder Ctrl+Alt+T für Terminal
```

---

## Fehlerbehebung

### Dashboard lädt nicht
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Touchscreen reagiert nicht
```bash
# Kalibrierung
sudo apt-get install xinput-calibrator
xinput_calibrator
```

### Docker Neustart
```bash
docker-compose restart
```

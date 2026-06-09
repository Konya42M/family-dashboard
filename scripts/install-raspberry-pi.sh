#!/bin/bash
# Familien-Dashboard - Raspberry Pi 3 Installationsskript
# Getestet auf Raspberry Pi OS Bullseye (32-bit / 64-bit)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

log "=== Familien-Dashboard Raspberry Pi Installer ==="

# System aktualisieren
log "System aktualisieren..."
sudo apt-get update && sudo apt-get upgrade -y

# Abhängigkeiten installieren
log "Abhängigkeiten installieren..."
sudo apt-get install -y \
  curl \
  git \
  ca-certificates \
  gnupg \
  lsb-release \
  xdotool \
  unclutter \
  chromium-browser

# Docker installieren
if ! command -v docker &> /dev/null; then
  log "Docker installieren..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  log "Docker installiert. Neustart empfohlen."
fi

# Docker Compose installieren
if ! command -v docker-compose &> /dev/null; then
  log "Docker Compose installieren..."
  sudo pip3 install docker-compose 2>/dev/null || \
  sudo apt-get install -y docker-compose
fi

# Projektverzeichnis erstellen
PROJECT_DIR="/home/$USER/family-dashboard"
log "Projekt nach $PROJECT_DIR kopieren..."
mkdir -p "$PROJECT_DIR"

# .env erstellen wenn nicht vorhanden
if [ ! -f "$PROJECT_DIR/.env" ]; then
  cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env" 2>/dev/null || true
  # JWT Secret generieren
  JWT_SECRET=$(openssl rand -hex 32)
  sed -i "s/your-very-secret-key-change-this/$JWT_SECRET/" "$PROJECT_DIR/.env"
  log ".env mit zufälligem JWT Secret erstellt"
fi

# Datenverzeichnis erstellen
mkdir -p "$PROJECT_DIR/data"

# Docker Build & Start
log "Docker Container bauen und starten..."
cd "$PROJECT_DIR"
docker-compose up -d --build

# Seed-Daten laden
log "Demo-Daten laden..."
sleep 5
docker exec family-dashboard-backend node dist/database/seed.js || warn "Seed fehlgeschlagen (evtl. bereits vorhanden)"

# Autostart für Kiosk-Modus einrichten
log "Kiosk-Autostart einrichten..."

# Autostart-Verzeichnis erstellen
mkdir -p /home/$USER/.config/autostart

cat > /home/$USER/.config/autostart/family-dashboard.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=Family Dashboard
Exec=/home/pi/family-dashboard/scripts/start-kiosk.sh
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

# Kiosk-Startskript erstellen
cat > "$PROJECT_DIR/scripts/start-kiosk.sh" << 'KIOSK_EOF'
#!/bin/bash
# Warten bis Dashboard bereit
sleep 10

# Maus verstecken
unclutter -idle 0.5 -root &

# Bildschirm-Timeout deaktivieren
xset s off
xset s noblank
xset -dpms

# Chromium im Kiosk-Modus starten
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --no-first-run \
  --disable-translate \
  --disable-features=TranslateUI \
  --check-for-update-interval=31536000 \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --touch-events=enabled \
  --enable-touch-drag-drop \
  http://localhost:3000
KIOSK_EOF

chmod +x "$PROJECT_DIR/scripts/start-kiosk.sh"

# Systemd Service für Auto-Neustart
log "Systemd Service erstellen..."
sudo tee /etc/systemd/system/family-dashboard.service > /dev/null << EOF
[Unit]
Description=Family Dashboard
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
User=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable family-dashboard.service
sudo systemctl start family-dashboard.service

# Raspberry Pi Konfiguration für Touchscreen
log "Raspberry Pi Touchscreen-Konfiguration..."
sudo tee -a /boot/config.txt > /dev/null << 'EOF'

# Family Dashboard - Touchscreen-Konfiguration
lcd_rotate=2
display_rotate=0
dtoverlay=vc4-kms-v3d
max_framebuffers=2
EOF

# GPU Speicher erhöhen für Chromium
sudo raspi-config nonint do_memory_split 128

log ""
log "=== Installation abgeschlossen! ==="
log ""
log "Dashboard läuft unter: http://localhost:3000"
log ""
log "Demo-Zugänge:"
log "  Papa:  papa@familie.local / family123"
log "  Mama:  mama@familie.local / family123"
log "  Yusuf: yusuf@familie.local / kind123"
log "  Aysha: aysha@familie.local / kind123"
log ""
log "Kiosk-Modus startet automatisch nach Neustart."
log "Bitte neu starten: sudo reboot"

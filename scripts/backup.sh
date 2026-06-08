#!/bin/bash
# Backup-Skript für Family Dashboard
BACKUP_DIR="/home/$USER/family-dashboard-backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"
cp /home/$USER/family-dashboard/data/family.db "$BACKUP_DIR/family_$DATE.db"
# Backups älter als 30 Tage löschen
find "$BACKUP_DIR" -name "*.db" -mtime +30 -delete
echo "Backup erstellt: $BACKUP_DIR/family_$DATE.db"

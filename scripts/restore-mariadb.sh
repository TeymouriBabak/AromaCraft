#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="$(dirname "$0")/../backups"
if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup-file.sql>"
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-aromacraft_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-local_app_password}"
MYSQL_DATABASE="${MYSQL_DATABASE:-aromacraft}"

export MYSQL_PWD="$MYSQL_PASSWORD"
echo "Restoring backup: $BACKUP_FILE"
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" "$MYSQL_DATABASE" < "$BACKUP_FILE"
echo "Restore complete."

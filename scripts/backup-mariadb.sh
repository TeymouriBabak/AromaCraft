#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="$(dirname "$0")/../backups"
mkdir -p "$BACKUP_DIR"

MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-aromacraft_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-local_app_password}"
MYSQL_DATABASE="${MYSQL_DATABASE:-aromacraft}"

export MYSQL_PWD="$MYSQL_PASSWORD"
BACKUP_FILE="$BACKUP_DIR/aromacraft-$(date +%Y%m%d-%H%M%S).sql"

echo "Creating backup: $BACKUP_FILE"
mysqldump -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" "$MYSQL_DATABASE" > "$BACKUP_FILE"
echo "Backup complete."

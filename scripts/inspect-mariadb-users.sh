#!/usr/bin/env bash
set -euo pipefail
cat >/tmp/inspect-users.sql <<'SQL'
SELECT User, Host, plugin FROM mysql.user WHERE User='aromacraft_user' OR User='root';
SHOW GRANTS FOR 'aromacraft_user'@'localhost';
SHOW GRANTS FOR 'aromacraft_user'@'%';
SQL
sudo mysql < /tmp/inspect-users.sql

#!/usr/bin/env bash
set -euo pipefail
cat >/tmp/test-login.sql <<'SQL'
SELECT USER(), CURRENT_USER(), @@hostname;
SQL
mariadb --defaults-file=/etc/mysql/debian.cnf --user=aromacraft_user --password=local_app_password --execute='SELECT USER(), CURRENT_USER();'

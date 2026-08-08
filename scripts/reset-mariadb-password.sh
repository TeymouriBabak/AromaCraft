#!/usr/bin/env bash
set -euo pipefail

mariadb -uroot <<'SQL'
ALTER USER 'aromacraft_user'@'localhost' IDENTIFIED BY 'local_app_password';
ALTER USER 'aromacraft_user'@'%' IDENTIFIED BY 'local_app_password';
FLUSH PRIVILEGES;
SQL

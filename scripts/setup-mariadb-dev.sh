#!/usr/bin/env bash
set -euo pipefail

mariadb -uroot <<'SQL'
CREATE DATABASE IF NOT EXISTS aromacraft;
CREATE USER IF NOT EXISTS 'aromacraft_user'@'%' IDENTIFIED BY 'local_app_password';
CREATE USER IF NOT EXISTS 'aromacraft_user'@'localhost' IDENTIFIED BY 'local_app_password';
GRANT ALL PRIVILEGES ON aromacraft.* TO 'aromacraft_user'@'%';
GRANT ALL PRIVILEGES ON aromacraft.* TO 'aromacraft_user'@'localhost';
FLUSH PRIVILEGES;
SQL

mariadb -uroot -e "SELECT User, Host FROM mysql.user WHERE User='aromacraft_user';"

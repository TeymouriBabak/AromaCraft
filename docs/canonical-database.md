Canonical database for local development

- Authoritative DB: `aromacraft-mysql-dev` (MySQL) mapped to host port `3308`.
- Reason: Prisma migrations and `DATABASE_URL` historically point to port 3308 and developer workflows/seed scripts run against it.
- Credentials (host-side): `root` / `devpass` (as used for `DATABASE_URL` in .env/.env.development).

Notes:

- `aromacraft-mariadb` is present (mapped to host port 3307) but appears to be a legacy/secondary instance. Confirm before using it for production data.
- When running inside Docker, services should use the Docker service name and container port (e.g., `mysql-dev:3306` or `mariadb:3306`).
- Scripts that run on the host should use `127.0.0.1` and the host published ports (e.g., `127.0.0.1:3308`).

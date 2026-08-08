# AromaCraft

AromaCraft is a fully local, offline-capable premium coffee storefront built with Next.js App Router, Prisma, and MariaDB.

## Local development

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Start the local database:

- With Docker:
  ```bash
  npm run db:docker
  ```
- Or with local MariaDB / WSL:
  ```bash
  bash scripts/setup-mariadb-dev.sh
  ```

3. Generate Prisma artifacts, sync the schema, and seed demo data:

```bash
npm run db:init
```

4. Start the app:

```bash
npm run dev
```

5. Open the site in your browser:

```text
http://localhost:3000
```

## Offline runtime and local assets

- All app images are served from `public/images/`.
- The application uses a local font from `src/fonts/`.
- No runtime image assets are fetched from remote CDNs.
- Authentication is backed by Prisma sessions and a local MariaDB database.

## Database setup

- `docker-compose.yml` defines a local MariaDB service.
- `scripts/setup-mariadb-dev.sh` creates the database and application user.
- `scripts/verify-db-connection.mjs` validates the configured database connection.

## Environment variables

Use `.env.example` as a template. Sensitive values belong in `.env`, which is ignored by Git.

- `DATABASE_URL` — Prisma connection string
- `AUTH_SECRET` — route hint and session signing secret
- `MYSQL_DATABASE` — MariaDB database name
- `MYSQL_USER` — MariaDB application user
- `MYSQL_PASSWORD` — MariaDB application user password
- `MYSQL_ROOT_PASSWORD` — root password for local database initialization

## Useful scripts

- `npm run dev` — start Next.js development server
- `npm run build` — compile production build
- `npm run start` — serve a built app
- `npm run lint` — run ESLint
- `npm run type-check` — run TypeScript checks
- `npm run db:docker` — start the local MariaDB container
- `npm run db:check` — verify database connectivity
- `npm run db:init` — generate Prisma client, sync the database schema, and seed demo data
- `npm run db:backup` — export the current local MariaDB database to `backups/`
- `npm run db:restore` — restore the local MariaDB database from `backups/`

## Backup and restore

Local database backup and restore scripts are provided under `scripts/`:

- `scripts/backup-mariadb.sh`
- `scripts/restore-mariadb.sh`

Use them to keep database snapshots locally without relying on external tooling.

## Security and reliability

- Session cookies are configured as `HttpOnly` and `Secure` in production.
- The app uses `SameSite=Lax` for safe cross-site compatibility during development.
- `.env` files are ignored and sensitive configuration should not be committed.

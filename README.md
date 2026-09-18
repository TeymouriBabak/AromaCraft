# AromaCraft

AromaCraft is a refined, offline-capable coffee marketplace for discovering exceptional beans, managing orders, and enjoying a seamless brew-to-door experience, powered by Next.js, Prisma, and MariaDB.

> Installation instructions: **[Add installation steps here]**

## Local development

1. Copy the example environment file if you do not already have a local `.env`:

```bash
cp .env.example .env
```

> `.env` is local-only and must never be committed or shared.

2. Start the stack with Docker:

```bash
docker compose up -d
```

3. Optional non-destructive checks:

```bash
docker compose ps
docker compose exec app npx prisma migrate status
```

4. Open the site in your browser:

```text
http://localhost:3001
```

5. Stop the stack when finished:

```bash
docker compose stop
```

## Runtime and connectivity

- App URL: http://localhost:3001
- Host database connection: 127.0.0.1:3307
- Internal Docker database connection: mariadb:3306
- Mailpit UI: http://localhost:8025
- Mock SMS endpoint: http://localhost:3010/sms

## Database and Prisma

- Prisma connects from the app container using `mariadb:3306`.
- The host machine uses `127.0.0.1:3307` for direct tooling only.
- Use non-destructive verification commands such as:

```bash
docker compose exec app npx prisma migrate status
docker compose logs mariadb --tail=50
docker compose logs app --tail=50
```

Do not run destructive reset commands such as `docker compose down -v` or `npx prisma migrate reset` unless you explicitly intend to rebuild the database from scratch.

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

# AromaCraft

AromaCraft is a premium coffee commerce platform designed to turn a simple coffee purchase into a refined digital experience. Built on Node.js and Next.js, the project combines a polished storefront, secure multi-role authentication, operational dashboards, and a production-style backend architecture to deliver a full-fidelity coffee brand experience.

From product discovery and checkout flows to order management, customer reporting, and admin operations, AromaCraft is engineered to feel fast, trustworthy, and modern — the kind of platform you would expect from a real coffee business with strong technical foundations.

## Why this project stands out

Coffee is more than a beverage — it is identity, ritual, quality, and craftsmanship. AromaCraft translates that ethos into a digital product with:

- a premium storefront experience for coffee discovery and conversion
- secure customer, manager, and admin authentication flows
- role-aware dashboards for operational visibility and decision-making
- order, review, and inventory workflows built for real business use
- a robust, secure, and developer-friendly local stack for iteration and testing

## Core platform technologies

### Node.js

AromaCraft runs on Node.js as its core JavaScript runtime, providing the foundation for the server-side logic, API processing, build pipeline, and application runtime. This enables a unified JavaScript ecosystem across the frontend and backend, making development more cohesive and modern while supporting efficient API-driven application patterns.

### Next.js

The application is built with Next.js, which provides the app framework, routing, rendering model, and backend API surface. Beyond serving the storefront, it powers the platform’s route handlers, auth flows, and dynamic dashboard logic with a modern full-stack structure.

### REST API architecture via Next.js Route Handlers

AromaCraft uses a REST-first API design implemented through Next.js Route Handlers. These endpoints provide structured access for authentication, order processing, dashboard analytics, product management, customer actions, and review moderation. The architecture keeps the application modular and predictable while supporting secure server-side processing patterns commonly used in production-ready commerce systems.

### MySQL compatibility alongside MariaDB

The platform is designed around Prisma and relational database patterns, with MariaDB as the primary local development database and MySQL-compatible deployment semantics supported throughout. This gives the application portability across common relational database environments while preserving compatibility with a widespread production stack. In other words, AromaCraft is built with a database layer that is both practical for local development and realistic for enterprise-oriented deployment.

## Tech stack

- Node.js
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Prisma ORM
- MariaDB
- MySQL-compatible relational workflow
- Redis
- Docker Compose
- Vitest
- ESLint
- Zod validation
- JWT/session security tooling
- dotenv environment configuration

## Product highlights

### Customer experience

- premium coffee catalog and shopping experience
- wishlist and cart interactions
- signup, login, OTP verification, and password recovery flows
- customer dashboards for account visibility and order awareness
- responsive, storefront-first design tailored for digital commerce

### Business operations

- manager and admin dashboard views with KPI tracking
- inventory, sales, and performance reporting
- review moderation and content management workflows
- real-world operational controls for running a modern storefront

### Security and reliability

- fail-closed rate limiting and Redis-backed request protection
- secure cookie handling and session-safe authentication patterns
- password hashing with bcrypt-based verification
- JWT/Jose-based token handling for authenticated routes and session logic
- strict validation pipelines for user input, auth requests, and sensitive actions
- development tools for safe local testing with mock email and mock SMS flows

## Hidden but essential stack components

Beyond the obvious storefront and database layers, AromaCraft also relies on several essential engineering primitives that strengthen both reliability and maintainability:

### Runtime and environment management

- Node.js provides the execution environment for the app and tooling
- dotenv loads environment variables from local configuration files
- environment-based configuration separates local, dev, and production-safe behavior

### Authentication and session security

- bcryptjs secures password hashing and verification
- jose handles JWT-based signing and verification for token-driven security flows
- secure cookie configuration protects session integrity and user identity
- rate limiting guards critical endpoints such as login, signup, OTP verification, and password resets

### Validation and input safety

- Zod provides schema-driven validation for API request integrity
- React Hook Form and resolver integration support form validation and user input handling
- input normalization ensures consistent handling of identifiers such as usernames, mobile numbers, and account data

### Local infrastructure

- Docker Compose orchestrates local services for the database, cache, mail, and SMS testing tools
- Redis supports request throttling and fail-safe security logic
- Mailpit enables email delivery testing without external services
- mock SMS endpoints simulate OTP messaging in local development
- Prisma migrations and seed scripts streamline setup and data initialization

## Architecture overview

AromaCraft follows a modern full-stack architecture tailored for commerce and operational dashboards:

- Frontend: Next.js app and React components for storefront and administrative interfaces
- API layer: REST endpoints powered by Next.js Route Handlers for auth, commerce, and dashboard operations
- Business logic: role-aware services and validation pipelines for users, products, orders, and reviews
- Data layer: Prisma models and MariaDB/MySQL-compatible relational storage
- Cache and rate limiting: Redis-backed protections for secure, resilient request handling
- Local development stack: Dockerized database, mail, messaging, and seeded test data

## Getting started

### Prerequisites

- Node.js 18 or newer recommended
- npm
- Docker Desktop or Docker Engine
- a local `.env` file based on `.env.example`

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Copy the example environment file and customize it for your local setup:

```bash
cp .env.example .env
```

> Keep `.env` local-only. Never commit secrets or real credentials.

### 3) Start the local infrastructure

```bash
docker compose -f docker-compose.dev.yml up -d
```

This launches the supporting services for the app, including MariaDB and Redis.

### 4) Initialize the database and seed data

```bash
npm run db:init
```

This generates the Prisma client, syncs the schema, and seeds the project with demo data.

### 5) Run the application

```bash
npm run dev
```

Open the app in your browser at:

```text
http://localhost:3000
```

## Useful commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run type-check
npm test

npm run db:up
npm run db:down
npm run db:init
npm run db:check
npm run db:backup
npm run db:restore
```

## Local services

The local environment exposes the following tools and endpoints:

- App: http://localhost:3000
- MariaDB: localhost:3307
- Redis: localhost:6399
- Mailpit UI: http://localhost:8025
- Mock SMS: http://localhost:3001

## Database and Prisma workflow

AromaCraft uses Prisma as the system of record for application data. The schema and migration flow live in:

- `prisma/schema.prisma`
- `prisma/migrations/`
- `prisma/seed.ts`

Recommended workflow:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db push
npx tsx prisma/seed.ts
```

## Folder overview

```text
.
├── src/                  # Frontend app, APIs, auth flows, and business logic
├── prisma/               # Prisma schema, migrations, and seed data
├── services/             # Local support services and specialized runtime tools
├── scripts/              # DB backup, verification, and maintenance scripts
├── public/               # Static assets and storefront resources
├── tests/                # Automated validation for auth, security, and business flows
├── docker-compose.yml    # Local runtime services and orchestration
├── docker-compose.dev.yml
├── package.json          # Dependency and runtime scripts
├── .env.example          # Local environment template
├── README.md             # Project overview and setup guide
├── next.config.ts        # Next.js configuration
└── .gitignore            # Repository hygiene and local artifact filtering
```

## Project philosophy

AromaCraft is designed to balance user delight with engineering discipline. It brings together an elegant customer-facing experience and a backend architecture that values security, maintainability, testability, and operational clarity. The result is a platform that feels premium to the user and professional to the developer.

## License

This project is currently configured for local development and portfolio/demo use. Update the license metadata before production deployment or public distribution.

## Contributing

Contributions are welcome for improvements in UX, performance, security, testing, and feature expansion. If you want to improve the shopping journey, strengthen backend safeguards, or extend the dashboard product, this project is ready for that next step.

---

Built with passion for exceptional coffee experiences, scalable engineering, and modern product craftsmanship.

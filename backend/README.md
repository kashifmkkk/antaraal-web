# Backend (Express + Prisma)

This backend provides simple APIs and a PostgreSQL database for the frontend.

Prerequisites: Docker and Node.js (for local development)

Quick start (with Docker Compose):

1. From the project root run:

```bash
docker-compose up -d --build
```

2. Install backend dependencies (once):

```bash
cd backend
npm install
npx prisma generate
```

3. Run migrations and seed (local dev):

```bash
npx prisma migrate dev --name init --preview-feature
npm run prisma:seed
```

4. Start backend in dev mode:

```bash
npm run dev
```

APIs available:
- `GET /api/health` - health check
- `GET /api/products` - list products
- `GET /api/products/:id` - product detail
- `GET /api/vendors` - list vendors
- `POST /api/rfqs` - submit RFQ
- `GET /api/rfqs` - list RFQs

The backend container includes an entrypoint that attempts to run `prisma generate`, apply migrations (if any), and run the seed script on container start. This helps initialize the database when using `docker-compose up`.

Note: For local development (outside container) run `npx prisma generate` before running the seed script.

Render deployment note:
- Use Render's internal PostgreSQL URL for `DATABASE_URL` (`*.render.internal`) to avoid Prisma `P1001` connectivity errors.
- Use `npm run start:render` as your start command. It runs `prisma migrate deploy` with retry/backoff before launching the server.
- Optional tuning vars: `DB_MIGRATE_MAX_ATTEMPTS` (default `15`) and `DB_MIGRATE_BASE_DELAY_MS` (default `2000`).

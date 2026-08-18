# HomeForge

HomeForge is a premium, customer-facing configurator for ordering a manufacturable 3D-printed coffee table. It is **not** a general CAD tool and **not** a printer/slicer control panel — customers configure dimensions, top shape, base style, material, and finish through a guided flow with a live 3D preview and real-time manufacturability feedback, then place a (stubbed) order and track it through a simulated production pipeline. Every ordered table gets a persistent digital-twin record and a pre-shipment qualification workflow.

## What's real vs. mocked

**Real:**
- PostgreSQL persistence (via Drizzle ORM) for projects, design versions, orders, digital twins, and qualification records.
- A manufacturability validation engine that reads limits from [`config/production-constraints.json`](config/production-constraints.json) and returns structured errors/warnings plus estimated print time and weight.
- The interactive 3D preview (React Three Fiber) and the validation engine both read from the exact same parameter object (`shared/tableDesign.ts`) — no drift between what you see and what gets validated.
- Immutable design versioning — saving a design creates a new, permanently locked `DesignVersion`; further edits create version N+1.
- Digital-twin creation at order time (physical identifier, status) and qualification-record sync on status changes.

**Mocked / clearly labeled placeholders:**
- Checkout payment — no real payment processor is connected; the form and card field are present for flow completeness only.
- The qualification sticker's QR code is decorative and not scannable.
- The Review page's digital-twin panel shows a labeled *preview* twin ID before an order exists; the real twin/physical ID is only created at order time.
- The Track page's production-status progression has no real printer/production system behind it — it advances only via a "Simulate next update" demo button and an admin panel that can force exception states (`DESIGN_INVALID`, `PRODUCTION_HOLD`, `QUALIFICATION_FAILED`, `CANCELLED`) for demo purposes.
- All production constraints (`config/production-constraints.json`) are explicitly flagged placeholders pending real printer/process specs — not production engineering values.

See [`docs/DECISIONS.md`](docs/DECISIONS.md) for the full list of locked product decisions, architecture notes, and one genuinely unresolved open UX question ("item 8") that was intentionally left as a flagged open question rather than guessed at.

## Tech stack

- **Frontend:** React + Vite, Tailwind CSS + shadcn/ui, wouter (hash router), TanStack Query
- **3D:** React Three Fiber, drei, three.js
- **Backend:** Express (TypeScript), tsx for dev, esbuild bundle for production
- **Database:** PostgreSQL via `drizzle-orm/node-postgres` + `pg` (async driver throughout)
- **Schema/migrations:** Drizzle ORM + `drizzle-kit push`

## Running locally

### Prerequisites

- Node.js 18+
- A running PostgreSQL instance (local Postgres works fine)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with your Postgres connection string:

   ```
   DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
   NODE_ENV=development
   PORT=5000
   ```

   `DATABASE_URL` **must** point at a PostgreSQL database — this project does not use SQLite.

3. Push the schema to your database (creates `projects`, `design_versions`, `orders`, `digital_twins`, `qualification_records`):

   ```bash
   npm run db:push
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   The app is served at `http://localhost:5000` (Express serves the API, Vite handles the client with HMR in dev).

### Production build

```bash
npm run build
npm start
```

`npm run build` bundles the client into `dist/public` and the server into `dist/index.cjs`; `npm start` runs the production server (`NODE_ENV=production`).

## Deploying to Render

A `render.yaml` blueprint is included at the repo root, provisioning a free-tier Postgres database and a free-tier Node web service wired together automatically.

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. In the Render dashboard: **New → Blueprint**, select this repository, and Render will read `render.yaml` and create both the `homeforge-db` Postgres instance and the `homeforge` web service.
3. Render injects `DATABASE_URL` automatically from the database into the web service's environment (no manual copy/paste needed).
4. On every deploy, `npm run db:push` runs before `npm start`, so schema changes sync automatically. This is safe to run repeatedly (it only adds/updates, never drops data).
5. Once live, your app is reachable at the `*.onrender.com` URL Render assigns (or a custom domain you attach in the Render dashboard).

Note: Render's free-tier web services spin down after inactivity and take a few seconds to cold-start on the next request — expect a brief delay on the first hit after idle time.

## Project structure

```
client/           React frontend (pages, components, hooks)
server/           Express backend (routes.ts, storage.ts)
shared/           Shared types & single source of truth: schema.ts, tableDesign.ts
config/           production-constraints.json — placeholder manufacturability limits
docs/             DECISIONS.md — locked decisions, architecture, open questions
```

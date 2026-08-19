# NestForge Studio

NestForge Studio is a premium, customer-facing configurator for ordering a manufacturable, 3D-printed-center coffee table. It is **not** a general CAD tool and **not** a printer/slicer control panel — customers pick a curated **base table**, a **center design** (the 3D-printed insert), a print **material**, and a **laminate finish** for the end panels through a guided flow with a live 3D preview and real-time manufacturability feedback, then place a (stubbed) order and track it through a simulated production pipeline. Every ordered table gets a persistent digital-twin record and a pre-shipment qualification workflow.

**Dimensions are never freely typed in.** All overall dimensions (width × depth × height) come entirely from the selected base table — there is no width/depth/height slider or numeric input anywhere in the customer flow. This is a deliberate, locked product decision (not an oversight): see ["Mockup reconciliation"](docs/DECISIONS.md#mockup-reconciliation-2026-08-19) in `docs/DECISIONS.md`.

## What's real vs. mocked

**Real:**
- PostgreSQL persistence (via Drizzle ORM) for projects, design versions, orders, digital twins, and qualification records.
- A curated **base-table catalog** (`config/production-constraints.json` → `baseTables`) — every customer design starts from one of these pre-approved tables; overall dimensions are derived from the chosen base table, never typed in freely.
- A manufacturability validation engine that reads limits from [`config/production-constraints.json`](config/production-constraints.json) and returns structured errors/warnings plus estimated print time and weight.
- The interactive 3D preview (React Three Fiber) and the validation engine both read from the exact same parameter object (`shared/tableDesign.ts`) — no drift between what you see and what gets validated.
- Immutable design versioning — saving a design creates a new, permanently locked `DesignVersion`; further edits create version N+1.
- Digital-twin creation at order time (physical identifier `NF-{year}-{order id}`, status) and qualification-record sync on status changes.
- A pre-ship qualification sticker (`QualificationSticker.tsx`) rebuilt pixel-for-pixel against the product's real mockup artwork — circular black/gold/cream badge with per-checkpoint status icons, a "fit guarantee" banner, a QR + qualification-ID/date block, a NestForge quality seal, and curved rim text, all laid out with concentric-circle-safe geometry so nothing clips or overlaps at any qualification state (`qualified={true|false}`).

**Mocked / clearly labeled placeholders:**
- Checkout payment — no real payment processor is connected; the form and card field are present for flow completeness only.
- The qualification sticker's QR code is decorative and not scannable.
- The Review page's digital-twin panel shows a labeled *preview* twin ID before an order exists; the real twin/physical ID is only created at order time.
- The Track page's production-status progression has no real printer/production system behind it — it advances only via a "Simulate next update" demo button and an admin panel that can force exception states (`DESIGN_INVALID`, `PRODUCTION_HOLD`, `QUALIFICATION_FAILED`, `CANCELLED`) for demo purposes.
- Two of the three base tables and two of the three center designs, plus all material/laminate options, are explicitly flagged placeholders in `config/production-constraints.json` (`confirmed: false` / `$comment`) — added so the catalog/gallery screens have more than one option, pending real supplier and design data.
- All production constraints (`config/production-constraints.json`) are explicitly flagged placeholders pending real printer/process specs — not production engineering values.

See [`docs/DECISIONS.md`](docs/DECISIONS.md) for the full list of locked product decisions, architecture notes, the mockup reconciliation (CONFIRMED vs. ASSUMPTION), and one genuinely unresolved open UX question ("item 8") that was intentionally left as a flagged open question rather than guessed at.

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
2. In the Render dashboard: **New → Blueprint**, select this repository, and Render will read `render.yaml` and create both the `homeforge-db` Postgres instance and the `homeforge` web service. (These are legacy infrastructure identifiers from before the NestForge Studio rebrand — left as-is in `render.yaml` so they keep pointing at any already-provisioned Render resources; rename them there only if you're provisioning fresh.)
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

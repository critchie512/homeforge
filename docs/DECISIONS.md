# NestForge Studio — Decisions & Open Questions

This document records the locked product/architecture decisions that shaped this build, plus one genuinely open UX question that was never resolved and should not be guessed at.

> **2026-08-19 update:** The product owner (Chris Ritchie) provided three real ChatGPT-generated product mockups — a pre-ship qualification sticker, a build-instruction reference sheet, and the NestForge Studio mobile app home screen — which **supersede** the 2026-08-18 "preset sizes" assumption documented further below (see ["Reconciled against the original handoff document"](#reconciled-against-the-original-handoff-document-2026-08-18)). See ["Mockup reconciliation (2026-08-19)"](#mockup-reconciliation-2026-08-19) at the end of this document for the full CONFIRMED-vs-ASSUMPTION breakdown of what changed.

## Locked decisions (from spec)

1. **NestForge Studio is a configurator, not a CAD tool or printer UI.** Customers configure a curated base table, center design, material, and laminate finish/color. They never see slicer settings, nozzle/print-profile controls, or any machine/routing UI. All of that stays internal to manufacturing operations (out of scope for this build). *(Superseded 2026-08-19: the original spec's "dimensions, top shape, base style" customer controls were replaced by the base-table-catalog model — see "Mockup reconciliation" below.)*
2. **Every ordered table gets a persistent digital twin.** A `DigitalTwin` record is created at order time, linked to the `Order` and the locked `DesignVersion`, carrying a physical identifier (`NF-{year}-{6-digit order id}`), status, and (via `QualificationRecord`) production/inspection history. *(Prefix updated 2026-08-19 from `HF-` to `NF-` to match the NestForge rebrand.)*
3. **Pre-shipment qualification is part of the product**, not an afterthought. A `QualificationRecord` (status, inspection notes, `qualified` boolean) is attached to the twin, and a qualification "sticker" (identifier + status + inspection metadata + a decorative, non-scannable QR placeholder) is shown as a preview on the Review page and live on the Track page.
4. **Sharing/remix is explicitly Phase 2.** Nothing in this build depends on it, and no UI stubs were added that would need to be un-shipped later.
5. **Production constraints are configurable data, not hard-coded engineering values.** All manufacturability limits (width/depth/height ranges, wall thickness, minimum leg diameter, per-material density/speed factors, estimation constants) live in [`config/production-constraints.json`](../config/production-constraints.json), which is explicitly annotated with `$comment` fields and a `revision: "placeholder-v1"` flag stating these are placeholders pending real printer/process specs — not production-ready manufacturing values.
6. **Single source of truth for parameters.** [`shared/tableDesign.ts`](../shared/tableDesign.ts) defines `TableParams`, `estimateMetrics()`, and `validateTableDesign()`. Both the live 3D preview (`TablePreview.tsx`, React Three Fiber) and the manufacturability validation engine (used by both client-side live feedback and the server-side `/api/validate` route) consume the exact same parameter object and the exact same constraints file — there is no separate "preview-only" geometry model that could drift from the validated one.
7. **Design versions are immutable once saved.** `DesignVersion` rows are never updated in place. Editing a saved design creates version N+1 with a fresh row; the old version remains permanently readable (used by `DigitalTwin`/`Order` history and the locked-version badge on the Review page).
8. **Item 8 — open UX question (unresolved, genuinely lost).** The original spec references an eighth locked decision or open UX item that was not recovered in the material available for this build. We are explicitly **not inventing content for it**. This is flagged here as an open question for a human product owner to fill in, rather than guessed at by an agent. To keep this cheap to resolve later, the areas of the UI most likely to be affected by an unresolved UX decision — the Track page's status/exception model, the digital-twin/qualification display, and the Configure step flow — were built as small, isolated, swappable components (`Track.tsx`'s status-label maps, `QualificationSticker.tsx`, `StepSidebar.tsx`) rather than being inlined into larger page components, specifically so that whatever item 8 turns out to be can be slotted in without a rewrite.

## Recommended architecture

- **Client:** React + Vite + Tailwind + shadcn/ui, wouter hash router, TanStack Query (`apiRequest` wrapper) for all server I/O — no localStorage/cookies for app state, matching the standard webapp template's no-client-persistence rule.
- **3D preview:** React Three Fiber / drei / three.js, driven directly by `TableParams` from `shared/tableDesign.ts`.
- **Server:** Express + tsx (dev), esbuild-bundled for production. All routes in `server/routes.ts`, persistence in `server/storage.ts` via a `DatabaseStorage` class.
- **Database:** PostgreSQL via `drizzle-orm/node-postgres` + `pg` (async driver — every storage method uses `await db.select()/.insert()...returning()`, no SQLite-style sync calls). Schema lives in `shared/schema.ts`; tables were created with `drizzle-kit push` against the local Postgres instance defined by `DATABASE_URL` in `.env`.
- **Data model:** `Project` → `DesignVersion` (immutable, FK to project, full param JSON + validation JSON + version number) → `Order` (stub status/timestamps) → `DigitalTwin` (FK to order + design version, physical identifier, status) → `QualificationRecord` (FK to digital twin, status, inspection notes placeholder, `qualified` boolean).
- **Config-driven constraints:** `config/production-constraints.json` is read at both validation call sites (client preview feedback and server route) through the shared `tableDesign.ts` module, so there is exactly one place limits are defined and exactly one validation algorithm.

## Notable engineering decisions during QA

- **Round/oval-top leg placement bug (fixed).** The 3D preview originally positioned legs at the rectangular bounding-box corners regardless of the selected top shape, so legs floated outside the tabletop edge whenever the top was round or oval and width ≠ depth. Fix: `TablePreview.tsx` now detects `isRoundOrOval` and applies a `Math.SQRT1_2 * 0.82` footprint scale to the leg X/Z offsets so legs stay inset under elliptical tops. Verified visually for both round and oval variants.
- **Exception-state digital-twin sync bug (fixed).** Forcing an exception status (e.g. `qualification_failed`) via the Track page's admin demo panel updated the `Order` row but left the linked `DigitalTwin`/`QualificationRecord` stale, so the qualification sticker kept showing "Qualified" after a simulated failure. Fix: `POST /api/orders/:id/set-exception` now also updates the digital twin status and writes a new `QualificationRecord` (`status: "failed"`, `qualified: false`, placeholder inspection note) when the exception is `qualification_failed`, keeping the sticker and stepper consistent.
- **Mobile layout overflow bug (fixed).** On the Configure page, the numbered step sidebar (`StepSidebar.tsx`) is a horizontally-scrolling row below the `md` breakpoint. Its parent `<aside>` lacked `min-w-0`, so the flex/grid layout let the row expand the whole page instead of scrolling within its own bounds — this caused the entire Configure page to scroll sideways on a 375px viewport. Fix: added `min-w-0` to the `<aside>` wrapper in `Configure.tsx`, which lets the child's `overflow-x-auto` engage correctly and confines the horizontal scroll to the step strip.

## Reconciled against the original handoff document (2026-08-18)

The full original ChatGPT-to-Perplexity handoff document (`docs/PERPLEXITY_PROJECT_HANDOFF.md`, authored 2026-08-17 for project owner Chris Ritchie) was recovered and read in full this session — earlier work in this repo had only been built from an incomplete analysis summary of it. Everything in "Locked decisions (from spec)" above is confirmed consistent with the real document, including that **item 8 is genuinely absent** from the retained material (the document's own Section 9 states this explicitly) — it remains a flagged open question, not guessed at.

Two things the product owner asked for in this session are **not** explicitly defined in that document and are flagged here as this session's own implementation assumptions, per the document's own rule ("make a reasonable implementation choice... and clearly identify it as an assumption"):

1. **Home page (before/after transformation visual, site explanation, nav).** The document's Section 25 ("Questions That Are Still Actually Open") lists "exact coffee-table visual form(s)" and "exact contents/visual design of every customer screen" as explicitly undefined. There is no home-page spec anywhere in the 31 sections. Implemented as a new `Landing.tsx`: a sticky nav (How it works / Sizes & materials / Roadmap + theme toggle), a hero with the existing "start a project" flow, a custom flat-geometric SVG before/after room-corner illustration (not a photo — an intentional placeholder for real lifestyle photography), a 4-step "How it works" section that mirrors the Configure → Review → Checkout → Track flow, and a short sizes/materials teaser. All copy and visuals here are swappable once real product photography or exact marketing direction exists.
2. **Constrained/preset size selection instead of free-form width/depth/height sliders.** This one IS reasonably grounded in the document even though it isn't spelled out as a UI mechanism: Section 4 ("Product Experience") describes the customer stage as "adjust **supported** dimensions and visual options," and Section 16 ("Customer Controls vs. Internal Controls") lists the customer-facing control as "overall size, **approved** proportions" — not open-ended numeric sliders. Implemented as three supported size presets (Compact 800×500×400mm, Standard 1100×600×420mm — matches the prior default, Large 1500×750×450mm), added to `config/production-constraints.json` as `sizePresets` (never hard-coded in the client, consistent with decision #5) and consumed via `TableParams.sizePresetId` in `shared/tableDesign.ts`. `validateTableDesign()` still checks the resulting width/depth/height against the real `dimensions.*` min/max bounds, so manufacturability validation is unaffected — only the customer-facing control changed from three independent sliders to one preset picker.

**New roadmap idea — not in the original document either:** a future browsable catalog of pre-approved coffee tables sourced from selected suppliers (as an alternative/starting point to a fully custom configuration). This doesn't appear in the handoff's Section 21 Phase 2 list. It's noted as a "Coming soon" teaser on the home page only — nothing has been built or scheduled for it. If it moves forward, it should be folded into the Phase 2 documentation pattern in Section 21 of the handoff.

## What's real vs. mocked (see also README)

- **Real:** Postgres persistence for all five entities, the manufacturability validation engine reading live from the config file, immutable version history, the R3F 3D preview driven by the same params as validation, and the digital-twin/qualification-record creation and status-sync flow.
- **Mocked/placeholder (clearly labeled in the UI):** payment processing at Checkout, the qualification sticker's QR code (decorative, not scannable), the pre-order qualification sticker preview, and the Track page's production-status progression (advanced only via the "Simulate next update" demo button and the admin exception panel — no real printer/production system is connected).

## Mockup reconciliation (2026-08-19)

On 2026-08-19 the product owner (Chris Ritchie) provided three real ChatGPT-generated product mockup images that were not available when the 2026-08-18 reconciliation above was written:

1. A circular **pre-ship qualification sticker** (black/gold/cream badge design).
2. A **build-instruction reference sheet** (printer spec, budget, base table, center-pattern close-up).
3. The **NestForge Studio mobile app home screen** (before/after hero, Explore Designs / Create Your Own cards, Choose a Table banner, bottom tab nav).

These are treated as the authoritative source of truth going forward, superseding the 2026-08-18 "three size presets" assumption (item 2 in the previous reconciliation section) everywhere they conflict. `config/production-constraints.json` was rebuilt to `revision: "v2-mockup-aligned"` with per-field `$comment` tags; the full CONFIRMED / ASSUMPTION / PLACEHOLDER breakdown is:

**CONFIRMED (came directly from the mockup images):**
- Printer: Bambu Lab P1S, 256 × 256 × 256 mm build volume (build-instruction sheet, Section 1).
- Budget: $150 total (build-instruction sheet, Section 1).
- Base table: IKEA LACK Coffee Table, Black Brown, $49.99, 1200 × 780 × 450 mm / 47¼ × 30¾ × 17¾ in (build-instruction sheet, Section 2).
- Center design "Flowing Waves" — the sculptural ripple pattern shown in both the build-instruction sheet's center-pattern close-up (Section 3) and the app home-screen imagery.
- Product model shape: **base table → center design → material → laminate finish**, replacing free-form width/depth/height entry entirely — dimensions are never typed in, only derived from the selected base table (matches the app mockup's "CHOOSE A TABLE / Select your base from our curated collection" flow).
- Qualification sticker layout: circular black/gold/cream badge, five per-checkpoint status icons, a "QUALIFIED FOR NESTFORGE FIT GUARANTEE" banner, QR + qualification-ID/date block, a NestForge quality seal, and curved rim text — rebuilt pixel-for-pixel in `QualificationSticker.tsx` against the sticker mockup.
- App branding and IA: NestForge Studio name/wordmark, bottom tab nav (Home / Tables / Create / Saved / Account), before/after hero framing, Explore Designs vs. Create Your Own split — all taken directly from the app home-screen mockup and reflected in `Landing.tsx` / `BottomMobileNav.tsx`.

**ASSUMPTION (a specific number wasn't given, but a defensible value was derived from the mockups):**
- `centerSectionWidthMm: 720` on the LACK base table (60% center / 20% each end) — estimated from the build-instruction sheet's top-view proportions; no source gives this as an explicit number.

**PLACEHOLDER (not in any source mockup — added only so multi-option UI has something to show, and explicitly flagged `confirmed: false` in the config so they're easy to find and replace):**
- Two additional base tables (`curated-walnut-frame`, `curated-compact-black`) — added so the "curated collection" browsing screen has more than one option.
- Two additional center designs (`concentric-rings`, `geometric-facets`) — added so "Explore Designs / browse and remix" has more than one design.
- All three print materials' density/speed factors, and the `baseHoursPerLiter: 6.5` print-time heuristic — none of the mockups specify real slicer/material data.
- The four laminate finish options (Warm Oak, Charcoal, Bone White, Espresso Walnut) — reasonable finish names for the end panels; not present in the source mockups.

### Qualification sticker bug fix (2026-08-19)

The first implementation of `QualificationSticker.tsx` against the sticker mockup had a geometry bug: the QR code, qualification-ID/date text block, and the curved footer rim text could overlap the cream content background or the checkpoint/fit-guarantee rows above it, because those elements' positions and their enclosing cream-colored background rectangle were computed independently instead of against a shared boundary. Fixed by:

- Compressing the checkpoint-icon row and fit-guarantee row slightly so the cream section starts higher.
- Giving the cream background its own dedicated inner clip circle (radius 178, same center as the sticker), strictly smaller than the footer arc's radius (196) — so the cream area and the curved footer text can never overlap again, by construction, rather than by careful coordinate tuning.
- Re-deriving the QR code, ID/date text, divider, and quality-seal positions against that new boundary, verifying every element's farthest corner stays safely inside the 178-radius cream clip.
- Verified via rendered screenshots (both `qualified={true}` and `qualified={false}` states, at 1x and 2x resolution) that no clipping or overlap remains, on both the standalone component and in context on the full Review page (desktop and mobile).

# 3-D Printed Coffee Table Project — Perplexity Development Handoff
**Prepared from the current ChatGPT project context**
**Project owner:** Chris Ritchie
**Date:** August 17, 2026
**Purpose:** Give another AI development environment enough context to continue this project without re-litigating decisions already made.

---

# 1. How Perplexity Should Use This File

Treat this document as the current source of truth for the project unless Chris explicitly changes a decision.

When continuing development:

1. Preserve all decisions marked **LOCKED / AGREED**.
2. Do not ask Chris to reconfirm decisions already documented here.
3. When something is ambiguous, make a reasonable implementation choice that is consistent with the project principles and clearly identify it as an assumption.
4. Distinguish between:
   - **Agreed product requirements**
   - **Implementation recommendations**
   - **Open questions**
5. Prefer building working prototypes over extended theoretical discussion.
6. Maintain a premium, simple, consumer-friendly experience even when the underlying manufacturing workflow is technically complex.
7. Do not expose unnecessary printer/manufacturing complexity to the customer.
8. Keep a concept of a **digital twin** for each physical table/order.
9. Support future sharing/collaboration, beginning with a basic Phase 2 implementation.
10. Continue from the existing product concept rather than redesigning the premise from scratch.

---

# 2. Project Summary

The project is a consumer-facing system for designing and ordering a **3-D printed coffee table**.

The intent is not simply to build a 3-D model viewer. The product should connect:

- a customer-facing table design experience,
- a manufacturable 3-D model,
- a production workflow,
- pre-shipment qualification,
- order/project state,
- and a persistent **digital twin** representing the physical table.

The system should ultimately make custom 3-D printed furniture feel approachable and polished rather than like operating a 3-D printer.

The customer should focus on designing and buying the table.

The company controls the manufacturing details.

---

# 3. Core Product Principle

## The user does NOT choose the printer

**LOCKED / AGREED**

Chris explicitly decided:

> We don’t allow the user to select printer. We will print on the printer we have.

Therefore:

- Do not put printer selection in the customer UX.
- Do not ask the user for printer model, nozzle, slicer, machine profile, or similar production choices.
- Printer compatibility and machine selection are internal production concerns.
- The app should generate or constrain designs according to the production system available to the company.
- If multiple printers are added in the future, printer routing should remain internal unless Chris explicitly changes this policy.

This is an important product distinction.

---

# 4. Product Experience

The desired experience is a guided custom-product configurator, not a CAD application.

The interface should progressively help the user create a table while protecting manufacturability.

Likely major customer stages:

1. Start / create a table project.
2. Select or modify the basic table form.
3. Adjust supported dimensions and visual options.
4. Preview the table in 3-D.
5. Validate whether the design can be manufactured.
6. Show price and/or production implications.
7. Save the design.
8. Submit/order the design.
9. Track production.
10. Associate the completed physical table with its digital twin.

The UI should hide technical manufacturing parameters unless they are useful to the customer.

---

# 5. Manufacturing-Aware Design

The system should not let customers freely create impossible geometry and discover the problem only at the end.

Manufacturing constraints should inform the configurator.

Possible constraints include:

- available print volume,
- table dimensions,
- structural wall thickness,
- unsupported spans,
- stability,
- base geometry,
- top geometry,
- minimum feature sizes,
- assembly requirements if multiple printed sections are necessary,
- material constraints,
- print time implications,
- weight,
- tolerances,
- post-processing requirements.

Exact numeric values are not included in the retained project conversation and should be treated as configurable production data rather than invented constants.

Perplexity should create a parameter/config layer so those limits can be updated without rebuilding the application.

---

# 6. Pre-Ship Qualification

A **pre-ship qualification process/sticker** has already been accepted as part of the project.

**LOCKED / AGREED**

The project includes a **pre-ship qualification sticker image** intended to become part of the project assets/files.

The sticker should represent that the physical table has passed the required checks before shipping.

The qualification concept should be connected to the order and digital twin.

A useful implementation would include fields such as:

- product/project identifier,
- order identifier,
- digital twin identifier,
- manufacturing completion date,
- qualification date,
- quality check status,
- inspector or station identifier,
- optional QR code,
- production version / design version.

Do not assume those exact fields are final if they conflict with a later project asset; they are a recommended data model based on the accepted concept.

The sticker asset itself was requested/generated in the prior ChatGPT workflow, but the binary image is not embedded in this Markdown handoff.

If that asset is unavailable in the new environment, recreate it from the project design direction rather than discarding the feature.

---

# 7. Digital Twin

**LOCKED / AGREED**

Each table should have a digital twin.

The digital twin is the persistent digital representation of the table and should survive beyond the initial configurator session.

The twin can eventually connect:

- design parameters,
- geometry/model version,
- rendered preview,
- order,
- owner/customer,
- manufacturing state,
- production metadata,
- qualification status,
- shipment,
- physical serial / identifier,
- QR code,
- documentation,
- future updates or replacement parts,
- sharing permissions.

The digital twin should be designed as a durable product object rather than a temporary browser state.

## Recommended identity model

Each project/table should have:

- `project_id`
- `design_id`
- `design_version`
- `digital_twin_id`
- `order_id` when purchased
- `physical_product_id` / serial when produced

Do not collapse every identifier into one ID unless there is a deliberate architecture reason.

---

# 8. Sharing

Chris agreed to **Phase 2 basic sharing**.

**LOCKED / AGREED AS PHASE 2**

Sharing does not need to block the initial MVP.

A basic Phase 2 version can support:

- shareable project link,
- read-only design viewing,
- optional invitation to a collaborator,
- copy/duplicate a shared design,
- owner-controlled visibility.

More complex real-time collaboration is not required for the first sharing release unless Chris later asks for it.

---

# 9. UX Item Still Requiring Discussion

In the latest retained project discussion, Chris agreed to most items but explicitly said:

> “Let’s talk more about this UX”

for item 8 of a prior ten-item list.

The exact text of that item is not present in the retained conversation excerpt.

Therefore:

- Do **not** falsely mark every UX choice as finalized.
- Preserve the fact that at least one UX area remains open for discussion.
- If the original design/spec is available elsewhere, identify what “item 8” was before treating it as settled.
- If it is not recoverable, continue building around the locked product principles while keeping UX modular enough to revise.

---

# 10. Deployment / Development Direction

Chris explored moving development outside ChatGPT and specifically discussed:

- Perplexity as another development platform,
- temporary ChatGPT hosting,
- Render,
- development mode in ChatGPT,
- using another account for development.

The current request is to make the project portable to **Perplexity**.

The prior deployment direction included:

**Render** as a target hosting platform.

Therefore a web implementation should preferably be straightforward to deploy on Render.

No final framework choice is contained in the retained project context.

A sensible implementation should favor common, portable web technologies and avoid unnecessary vendor lock-in.

---

# 11. Recommended Technical Architecture

The following is an implementation recommendation, not a record of a locked framework decision.

## Frontend

A modern web app capable of interactive 3-D rendering.

Recommended stack:

- React
- Next.js or Vite
- Three.js / React Three Fiber for 3-D
- TypeScript

Goals:

- smooth interactive model preview,
- responsive desktop/tablet experience,
- simple parameter controls,
- strong separation between customer options and manufacturing constraints.

## Backend

A backend/API responsible for:

- projects,
- design versions,
- users,
- order state,
- digital twins,
- manufacturing data,
- qualification records,
- generated assets.

Possible stack:

- Node/TypeScript API,
- Python service where geometry work benefits from Python,
- PostgreSQL for durable state.

## Geometry layer

Keep geometry generation separate from UI state.

Suggested abstraction:

`Design Parameters -> Validation -> Geometry Generator -> Preview/Export Model`

The same underlying design parameters should drive both:

- visual preview,
- manufacturing output.

Avoid creating a beautiful preview that does not correspond to the actual manufacturable model.

---

# 12. Suggested Domain Model

A starting domain model:

```text
User
 └── Project
      ├── Design
      │    ├── DesignVersion
      │    ├── Parameters
      │    ├── PreviewAsset
      │    ├── ManufacturingValidation
      │    └── GeometryAsset
      │
      ├── SharePermissions
      │
      └── Order
           └── DigitalTwin
                ├── PhysicalProduct
                ├── ProductionRecord
                ├── QualificationRecord
                ├── Shipment
                └── Documentation
```

---

# 13. Suggested Project State Machine

Example states:

```text
DRAFT
  ↓
DESIGN_VALID
  ↓
READY_TO_ORDER
  ↓
ORDERED
  ↓
PRODUCTION_QUEUED
  ↓
PRINTING
  ↓
POST_PROCESSING
  ↓
QUALIFICATION_PENDING
  ↓
QUALIFIED
  ↓
READY_TO_SHIP
  ↓
SHIPPED
  ↓
DELIVERED
```

There should also be exception states, for example:

- `DESIGN_INVALID`
- `PRODUCTION_HOLD`
- `QUALIFICATION_FAILED`
- `CANCELLED`

Exact naming can change.

---

# 14. Manufacturing Validation Model

Validation should return structured results rather than only true/false.

Recommended form:

```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "manufacturingMetrics": {
    "estimatedPrintTime": null,
    "estimatedMaterial": null,
    "estimatedWeight": null
  }
}
```

The customer UX should translate technical errors into understandable guidance.

Example:

Bad customer message:

> Mesh intersects machine build envelope by 46 mm.

Better customer message:

> This table is slightly too wide for production. Reduce the width to continue.

Technical details may still be logged internally.

---

# 15. Configuration Philosophy

Production limitations should live in configuration/data rather than being scattered through UI code.

Example concept:

```json
{
  "productionSystem": {
    "maxWidthMm": null,
    "maxDepthMm": null,
    "maxHeightMm": null,
    "minimumWallThicknessMm": null,
    "supportedMaterials": [],
    "defaultMaterial": null
  }
}
```

The null values here are intentional because the retained ChatGPT context does not include the real production measurements.

Do not invent them and later treat them as facts.

---

# 16. Customer Controls vs. Internal Controls

## Customer-facing

Potential customer-facing controls:

- overall size,
- approved proportions,
- shape/form,
- surface style,
- supported visual pattern,
- supported finish/material choice,
- color where applicable,
- preview,
- price,
- save,
- share,
- order.

## Internal-only

Keep these internal unless explicitly needed:

- printer selection,
- machine profile,
- slicing profile,
- nozzle,
- layer settings,
- extrusion details,
- bed settings,
- support parameters,
- operator routing,
- production queue assignment.

This division follows the locked decision that customers do not choose a printer.

---

# 17. Design Versioning

Every meaningful geometry-changing edit should be capable of being versioned.

At minimum:

- save current parameter set,
- assign design version,
- retain the version used for the order,
- prevent later edits from silently changing the manufacturing file for an existing order.

Once an order is released for production, the production design version should be immutable unless an explicit revision process occurs.

---

# 18. Digital Twin + Physical Product Link

The finished table should have a durable physical identifier.

A QR code on the pre-ship qualification sticker is a strong candidate.

The QR could resolve to a digital twin page showing appropriate information.

Customer-visible twin information might include:

- product name,
- original design,
- ownership,
- care instructions,
- order/manufacture date,
- design preview,
- documentation.

Internal twin information might additionally include:

- production files,
- printer used,
- print settings,
- inspection data,
- defect/rework records,
- operator notes.

This allows the customer UX to remain simple while preserving manufacturing traceability.

---

# 19. Security / Privacy

Sharing and digital twins should be permission-aware.

Do not expose internal production details publicly by default.

Recommended visibility levels:

- private,
- shared by link,
- invited collaborators,
- public showcase (future / optional).

Ownership transfer for physical products can be considered later but should not block MVP.

---

# 20. MVP Scope

A reasonable MVP consistent with existing decisions:

1. Create a table project.
2. Configure supported table parameters.
3. Render an interactive 3-D preview.
4. Validate against configurable production constraints.
5. Save project/design state.
6. Produce a manufacturing-ready model or handoff artifact.
7. Create an order record.
8. Create a digital twin record tied to the ordered design version.
9. Provide internal production status.
10. Record pre-ship qualification.

Not required to block MVP:

- advanced sharing,
- real-time collaboration,
- user-selected printers,
- multiple manufacturing-machine marketplace,
- highly complex CAD editing,
- public design marketplace.

---

# 21. Phase 2

Known Phase 2 direction:

## Basic sharing

Include:

- share link,
- read-only viewer,
- access control,
- optional duplication/remix.

Potential later capabilities:

- comments,
- design collaboration,
- public galleries,
- creator attribution,
- ownership transfer,
- digital twin service history.

Only the basic sharing concept is explicitly agreed.

---

# 22. Developer Experience

Keep the repository easy for another AI coding environment to understand.

Recommended repository structure:

```text
/
├── README.md
├── docs/
│   ├── PRODUCT_SPEC.md
│   ├── MANUFACTURING.md
│   ├── DIGITAL_TWIN.md
│   └── DECISIONS.md
├── app/ or src/
├── components/
├── geometry/
├── validation/
├── server/
├── database/
├── public/
│   └── assets/
│       └── pre-ship-qualification-sticker.*
├── tests/
└── render.yaml (if appropriate)
```

Maintain a `DECISIONS.md` or equivalent so that AI agents do not keep reopening settled questions.

---

# 23. Render Deployment

Render was selected as a direction for hosting experimentation.

Prepare the project so deployment can be simple.

Depending on stack:

- static frontend -> Render Static Site,
- full-stack web app -> Render Web Service,
- database -> Render Postgres or another managed provider.

Store secrets in environment variables.

Do not hard-code credentials.

A useful repository may include:

- build command,
- start command,
- environment variable documentation,
- health endpoint,
- `render.yaml` if infrastructure-as-code is beneficial.

---

# 24. AI Development Rules for Perplexity

When Perplexity generates code or product recommendations:

### Preserve
- customer simplicity,
- manufacturability,
- internal printer selection,
- digital twin,
- qualification workflow,
- future sharing,
- design version integrity.

### Avoid
- adding printer selection to the customer UI,
- exposing slicer controls,
- converting the tool into a generic CAD app,
- inventing production limits as though they are confirmed,
- changing locked decisions without explicit instruction,
- discarding the digital twin as “future scope,”
- treating the visual preview as independent from production geometry.

### Prefer
- reusable parametric components,
- explicit types,
- structured validation,
- deterministic geometry,
- portable deployment,
- good test coverage,
- visible error handling,
- clean project state.

---

# 25. Questions That Are Still Actually Open

These items are not fully defined in the retained project context:

- exact coffee-table visual form(s),
- exact supported dimensions,
- exact printer/build volume,
- exact material(s),
- structural engineering constraints,
- pricing formula,
- checkout/payment provider,
- shipping calculation,
- user authentication approach,
- exact contents/visual design of every customer screen,
- the unresolved UX item referred to as “item 8,”
- precise pre-ship qualification checklist,
- exact QR/digital-twin customer experience,
- whether an ordered design can be reordered,
- whether customer-uploaded geometry will ever be supported.

Perplexity should not pretend these are already settled.

---

# 26. Known Decision Ledger

Use this section as a concise memory of decisions visible in the retained ChatGPT project history.

## Agreed

- The overall 3-D printed coffee-table product direction.
- Continue building the product rather than only discussing it.
- Pre-ship qualification sticker concept.
- Digital twin concept.
- Phase 2 basic sharing.
- Customer does **not** select printer.
- Company prints using its own available production printer/system.
- Render as a deployment/hosting direction for testing.
- Most items in the prior requirements reviews were agreed by Chris.

## Not fully settled

- One UX topic from item 8 of the last ten-item review.
- Technical values not present in this file.
- Framework implementation details unless present in another project artifact.

---

# 27. Important Historical Context

Recent project sequence:

1. Requirements/product decisions were reviewed in numbered groups.
2. Chris repeatedly approved most recommendations.
3. Chris approved adding a pre-ship qualification sticker to project files.
4. Chris approved a digital twin.
5. Chris approved basic sharing for Phase 2.
6. Chris explicitly corrected the printer-selection idea:
   **the customer does not select a printer; the company prints on the printer it has.**
7. Chris wanted further discussion on one UX item.
8. Chris then moved toward implementation/hosting.
9. Render was chosen as a target for trying the web application.
10. Chris investigated using another ChatGPT account for development.
11. Chris now wants to try development on Perplexity and requested this complete handoff.

---

# 28. Suggested First Task for Perplexity

Start by converting this handoff into a working repository specification and inspect any existing project files/code Chris provides.

If code already exists:

1. inventory the repo,
2. map current implementation to this spec,
3. identify conflicts,
4. preserve working code,
5. fix only the gaps needed for the next functional milestone,
6. make the project deployable on Render.

If no code exists:

Build the first vertical slice:

```text
Create Project
→ Change table parameters
→ Update 3-D preview
→ Run manufacturability validation
→ Save design
→ Persist design version
→ Display project summary
```

Then add order/digital-twin workflow.

---

# 29. Prompt for Perplexity

You can give Perplexity this instruction together with this file:

> Treat the attached `PERPLEXITY_PROJECT_HANDOFF.md` as the source of truth for this project. Continue development from the documented decisions instead of restarting product discovery. Do not ask me to reconfirm locked decisions. First inspect any code/files I give you, compare them to the handoff, and then implement the next working milestone. Flag only genuine contradictions or missing inputs that prevent implementation.

---

# 30. Source-Limit Notice

This handoff includes all project knowledge available in the retained shared ChatGPT conversation context at the time it was created.

Some earlier numbered requirement lists and generated project assets are referenced by the retained conversation but their complete contents are not present in the accessible excerpt.

Therefore this file intentionally distinguishes between:

- confirmed decisions,
- inferred implementation guidance,
- missing details.

If Chris also exports or uploads the original source code, sticker image, earlier specs, screenshots, or design assets to Perplexity, those should be used together with this handoff.

The contents of those files should override any implementation assumption in this document when they contain more specific confirmed project information.

---

# 31. Final Product North Star

The product should make ordering a custom 3-D printed coffee table feel like designing a premium consumer product, not operating fabrication equipment.

The customer designs the table.

The software protects manufacturability.

The company controls production.

The ordered design becomes a persistent digital twin.

The physical table is qualified before shipment and remains traceable to its digital record.

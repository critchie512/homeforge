import type { Express } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { storage } from "./storage";
import {
  insertProjectSchema,
  insertDesignVersionSchema,
  insertOrderSchema,
} from "@shared/schema";
import {
  validateTableDesign,
  type ProductionConstraints,
  type TableParams,
} from "@shared/tableDesign";

function loadConstraints(): ProductionConstraints {
  // Resolve from the project root (process.cwd()) rather than import.meta.dirname:
  // the production server is bundled to CommonJS (dist/index.cjs), where
  // import.meta.dirname is unavailable. npm scripts (dev and start) are always
  // invoked from the project root, so process.cwd() is a stable anchor in both
  // dev (tsx) and production (bundled cjs) modes.
  const configPath = path.resolve(process.cwd(), "config", "production-constraints.json");
  const raw = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(raw) as ProductionConstraints;
}

// Production status state machine — see docs/DECISIONS.md for the full
// happy-path stepper plus exception states (DESIGN_INVALID,
// PRODUCTION_HOLD, QUALIFICATION_FAILED, CANCELLED).
export const HAPPY_PATH_STATUSES = [
  "draft",
  "design_valid",
  "ready_to_order",
  "ordered",
  "production_queued",
  "printing",
  "post_processing",
  "qualification_pending",
  "qualified",
  "ready_to_ship",
  "shipped",
  "delivered",
] as const;

export const EXCEPTION_STATUSES = [
  "design_invalid",
  "production_hold",
  "qualification_failed",
  "cancelled",
] as const;

function nextHappyPathStatus(current: string): string {
  const idx = HAPPY_PATH_STATUSES.indexOf(current as any);
  if (idx === -1 || idx === HAPPY_PATH_STATUSES.length - 1) return current;
  return HAPPY_PATH_STATUSES[idx + 1];
}

function generatePhysicalId(orderId: number): string {
  const year = new Date().getFullYear();
  return `NF-${year}-${String(orderId).padStart(6, "0")}`;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // -- Manufacturing config (read-only, customer never edits this) ---------
  app.get("/api/config/production-constraints", (_req, res) => {
    try {
      res.json(loadConstraints());
    } catch (err) {
      res.status(500).json({ message: "Failed to load production constraints." });
    }
  });

  // -- Validation (same engine used before save, and again at save time) ---
  app.post("/api/validate", (req, res) => {
    const params = req.body as TableParams;
    const constraints = loadConstraints();
    const result = validateTableDesign(params, constraints);
    res.json(result);
  });

  // -- Projects --------------------------------------------------------------
  app.get("/api/projects", async (_req, res) => {
    const list = await storage.listProjects();
    res.json(list);
  });

  app.post("/api/projects", async (req, res) => {
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid project payload.", issues: parsed.error.issues });
    }
    const project = await storage.createProject(parsed.data);
    res.status(201).json(project);
  });

  app.get("/api/projects/:id", async (req, res) => {
    const id = Number(req.params.id);
    const project = await storage.getProject(id);
    if (!project) return res.status(404).json({ message: "Project not found." });
    res.json(project);
  });

  // -- Design versions (immutable) -------------------------------------------
  app.get("/api/projects/:id/design-versions", async (req, res) => {
    const projectId = Number(req.params.id);
    const list = await storage.listDesignVersionsForProject(projectId);
    res.json(list);
  });

  app.get("/api/projects/:id/design-versions/latest", async (req, res) => {
    const projectId = Number(req.params.id);
    const latest = await storage.getLatestDesignVersion(projectId);
    if (!latest) return res.status(404).json({ message: "No design version yet." });
    res.json(latest);
  });

  // Creates a NEW immutable version. Always version = previous + 1. There is
  // no PATCH/PUT route for design-versions on purpose.
  app.post("/api/projects/:id/design-versions", async (req, res) => {
    const projectId = Number(req.params.id);
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found." });

    const params = req.body.params as TableParams;
    if (!params) return res.status(400).json({ message: "Missing design params." });

    const constraints = loadConstraints();
    const validation = validateTableDesign(params, constraints);

    const previous = await storage.getLatestDesignVersion(projectId);
    const nextVersionNumber = previous ? previous.version + 1 : 1;

    const parsed = insertDesignVersionSchema.safeParse({
      projectId,
      version: nextVersionNumber,
      params,
      validation,
    });
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid design version payload.", issues: parsed.error.issues });
    }

    const created = await storage.createDesignVersion(parsed.data);
    await storage.updateProjectCurrentVersion(projectId, created.id);
    res.status(201).json(created);
  });

  // -- Orders (stub checkout, no real payment) -------------------------------
  app.get("/api/projects/:id/order", async (req, res) => {
    const projectId = Number(req.params.id);
    const order = await storage.getOrderByProject(projectId);
    if (!order) return res.status(404).json({ message: "No order yet." });
    res.json(order);
  });

  app.post("/api/projects/:id/order", async (req, res) => {
    const projectId = Number(req.params.id);
    const latestVersion = await storage.getLatestDesignVersion(projectId);
    if (!latestVersion) {
      return res.status(400).json({ message: "Project has no saved design version yet." });
    }
    const validation = latestVersion.validation as any;
    if (!validation?.valid) {
      return res.status(400).json({ message: "Design version is not manufacturable; cannot order." });
    }

    const parsed = insertOrderSchema.safeParse({
      projectId,
      designVersionId: latestVersion.id,
      status: "ordered",
      customerName: req.body.customerName ?? null,
      customerEmail: req.body.customerEmail ?? null,
      shippingAddress: req.body.shippingAddress ?? null,
    });
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid order payload.", issues: parsed.error.issues });
    }

    const order = await storage.createOrder(parsed.data);

    // Immediately mint the digital twin record for the physical unit that
    // will eventually be produced against this order + design version.
    const twin = await storage.createDigitalTwin({
      orderId: order.id,
      designVersionId: latestVersion.id,
      physicalId: generatePhysicalId(order.id),
      status: "pending",
    });
    await storage.createQualificationRecord({
      digitalTwinId: twin.id,
      status: "pending",
      qualified: false,
      inspectionNotes: null,
    });

    res.status(201).json(order);
  });

  // -- Digital twin + qualification (Review page + Track page) --------------
  app.get("/api/orders/:id/digital-twin", async (req, res) => {
    const orderId = Number(req.params.id);
    const twin = await storage.getDigitalTwinByOrder(orderId);
    if (!twin) return res.status(404).json({ message: "No digital twin yet." });
    const qualification = await storage.getQualificationRecordByTwin(twin.id);
    res.json({ twin, qualification });
  });

  // -- Track: production status stepper + "simulate next update" -----------
  app.get("/api/orders/:id/status", async (req, res) => {
    const orderId = Number(req.params.id);
    const order = await storage.getOrder(orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json({
      status: order.status,
      happyPath: HAPPY_PATH_STATUSES,
      exceptions: EXCEPTION_STATUSES,
    });
  });

  app.post("/api/orders/:id/simulate-next", async (req, res) => {
    const orderId = Number(req.params.id);
    const order = await storage.getOrder(orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    const next = nextHappyPathStatus(order.status);
    const updated = await storage.updateOrderStatus(orderId, next);

    // Keep the digital twin + qualification record loosely in sync so the
    // Review/Track pages show a consistent story during the demo.
    const twin = await storage.getDigitalTwinByOrder(orderId);
    if (twin) {
      if (next === "qualification_pending") {
        await storage.updateDigitalTwinStatus(twin.id, "in_production");
      }
      if (next === "qualified") {
        await storage.updateDigitalTwinStatus(twin.id, "qualified");
        const qual = await storage.getQualificationRecordByTwin(twin.id);
        if (qual) {
          await storage.createQualificationRecord({
            digitalTwinId: twin.id,
            status: "qualified",
            qualified: true,
            inspectionNotes: "Placeholder inspection: dimensional check and surface QA passed (demo data).",
          });
        }
      }
      if (next === "shipped" || next === "delivered") {
        await storage.updateDigitalTwinStatus(twin.id, next);
      }
    }

    res.json(updated);
  });

  // Exception-state transition — minimal admin-ish action so
  // DESIGN_INVALID / PRODUCTION_HOLD / QUALIFICATION_FAILED / CANCELLED are
  // reachable somewhere, even though there's no real production system yet.
  app.post("/api/orders/:id/set-exception", async (req, res) => {
    const orderId = Number(req.params.id);
    const { status } = req.body as { status: string };
    if (!EXCEPTION_STATUSES.includes(status as any)) {
      return res.status(400).json({ message: "Not a recognized exception status." });
    }
    const updated = await storage.updateOrderStatus(orderId, status);
    if (!updated) return res.status(404).json({ message: "Order not found." });

    // Keep the digital twin/qualification record consistent with the
    // exception state so Track doesn't show a stale "Qualified" sticker
    // next to a QUALIFICATION_FAILED order.
    const twin = await storage.getDigitalTwinByOrder(orderId);
    if (twin && status === "qualification_failed") {
      await storage.updateDigitalTwinStatus(twin.id, "qualification_failed");
      await storage.createQualificationRecord({
        digitalTwinId: twin.id,
        status: "failed",
        qualified: false,
        inspectionNotes: "Placeholder inspection: demo exception state, not a real inspection result.",
      });
    }

    res.json(updated);
  });

  return httpServer;
}

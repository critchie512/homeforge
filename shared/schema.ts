import { pgTable, text, integer, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ---------------------------------------------------------------------------
// NestForge Studio data model
//
// Keep this simple and matched to the vertical slice: Project -> DesignVersion
// (immutable) -> Order (stub) -> DigitalTwin -> QualificationRecord.
// ---------------------------------------------------------------------------

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"), // draft | configuring | saved
  currentVersionId: integer("current_version_id"), // FK-ish pointer to latest design_versions.id
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  currentVersionId: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// DesignVersion: immutable once created. Any further edit produces version N+1
// for the same project. `params` is the single-source-of-truth parameter
// object also consumed by the 3D preview and the validation engine.
export const designVersions = pgTable("design_versions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  version: integer("version").notNull(), // 1, 2, 3... per project
  params: jsonb("params").notNull(), // TableParams JSON — see client/shared params module
  validation: jsonb("validation").notNull(), // ValidationResult JSON snapshot at save time
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDesignVersionSchema = createInsertSchema(designVersions).omit({
  id: true,
  createdAt: true,
});
export type InsertDesignVersion = z.infer<typeof insertDesignVersionSchema>;
export type DesignVersion = typeof designVersions.$inferSelect;

// Order: stub checkout record, no real payment processing.
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  designVersionId: integer("design_version_id").notNull(),
  status: text("status").notNull().default("draft"), // see ProductionStatus union
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  shippingAddress: text("shipping_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// DigitalTwin: persistent record for a physical, manufactured unit.
export const digitalTwins = pgTable("digital_twins", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  designVersionId: integer("design_version_id").notNull(),
  physicalId: text("physical_id").notNull().unique(), // e.g. NF-2026-000123
  status: text("status").notNull().default("pending"), // pending | in_production | qualified | shipped | ...
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDigitalTwinSchema = createInsertSchema(digitalTwins).omit({
  id: true,
  createdAt: true,
});
export type InsertDigitalTwin = z.infer<typeof insertDigitalTwinSchema>;
export type DigitalTwin = typeof digitalTwins.$inferSelect;

// QualificationRecord: pre-shipment inspection / QA record for a digital twin.
export const qualificationRecords = pgTable("qualification_records", {
  id: serial("id").primaryKey(),
  digitalTwinId: integer("digital_twin_id").notNull(),
  status: text("status").notNull().default("pending"), // pending | qualified | failed
  qualified: boolean("qualified").notNull().default(false),
  inspectionNotes: text("inspection_notes"), // placeholder freeform notes
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQualificationRecordSchema = createInsertSchema(qualificationRecords).omit({
  id: true,
  createdAt: true,
});
export type InsertQualificationRecord = z.infer<typeof insertQualificationRecordSchema>;
export type QualificationRecord = typeof qualificationRecords.$inferSelect;

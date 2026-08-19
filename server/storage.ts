import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, and } from "drizzle-orm";
import {
  projects,
  designVersions,
  orders,
  digitalTwins,
  qualificationRecords,
  type Project,
  type InsertProject,
  type DesignVersion,
  type InsertDesignVersion,
  type Order,
  type InsertOrder,
  type DigitalTwin,
  type InsertDigitalTwin,
  type QualificationRecord,
  type InsertQualificationRecord,
} from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Check your .env file.");
}

// node-postgres driver is ASYNC — every query below is awaited and uses
// .returning() rather than the sync .get()/.all()/.run() SQLite patterns.
//
// Hosted Postgres providers (Neon, Render Postgres, Supabase, etc.) require
// SSL. Local development Postgres does not use SSL, so we only enable it
// when the connection string requests it or we're in production.
const needsSsl =
  /sslmode=require/.test(process.env.DATABASE_URL) ||
  process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool);

export interface IStorage {
  // Projects
  createProject(data: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  listProjects(): Promise<Project[]>;
  updateProjectCurrentVersion(projectId: number, versionId: number): Promise<Project | undefined>;

  // Design versions (immutable — no update method by design)
  createDesignVersion(data: InsertDesignVersion): Promise<DesignVersion>;
  getDesignVersion(id: number): Promise<DesignVersion | undefined>;
  listDesignVersionsForProject(projectId: number): Promise<DesignVersion[]>;
  getLatestDesignVersion(projectId: number): Promise<DesignVersion | undefined>;

  // Orders
  createOrder(data: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByProject(projectId: number): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;

  // Digital twins
  createDigitalTwin(data: InsertDigitalTwin): Promise<DigitalTwin>;
  getDigitalTwinByOrder(orderId: number): Promise<DigitalTwin | undefined>;
  updateDigitalTwinStatus(id: number, status: string): Promise<DigitalTwin | undefined>;

  // Qualification records
  createQualificationRecord(data: InsertQualificationRecord): Promise<QualificationRecord>;
  getQualificationRecordByTwin(digitalTwinId: number): Promise<QualificationRecord | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createProject(data: InsertProject): Promise<Project> {
    const [row] = await db.insert(projects).values(data).returning();
    return row;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [row] = await db.select().from(projects).where(eq(projects.id, id));
    return row;
  }

  async listProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async updateProjectCurrentVersion(
    projectId: number,
    versionId: number,
  ): Promise<Project | undefined> {
    const [row] = await db
      .update(projects)
      .set({ currentVersionId: versionId, status: "saved" })
      .where(eq(projects.id, projectId))
      .returning();
    return row;
  }

  async createDesignVersion(data: InsertDesignVersion): Promise<DesignVersion> {
    // Design versions are immutable once created — this is the only write
    // path; there is intentionally no updateDesignVersion method.
    const [row] = await db.insert(designVersions).values(data).returning();
    return row;
  }

  async getDesignVersion(id: number): Promise<DesignVersion | undefined> {
    const [row] = await db.select().from(designVersions).where(eq(designVersions.id, id));
    return row;
  }

  async listDesignVersionsForProject(projectId: number): Promise<DesignVersion[]> {
    return db
      .select()
      .from(designVersions)
      .where(eq(designVersions.projectId, projectId))
      .orderBy(desc(designVersions.version));
  }

  async getLatestDesignVersion(projectId: number): Promise<DesignVersion | undefined> {
    const [row] = await db
      .select()
      .from(designVersions)
      .where(eq(designVersions.projectId, projectId))
      .orderBy(desc(designVersions.version))
      .limit(1);
    return row;
  }

  async createOrder(data: InsertOrder): Promise<Order> {
    const [row] = await db.insert(orders).values(data).returning();
    return row;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [row] = await db.select().from(orders).where(eq(orders.id, id));
    return row;
  }

  async getOrderByProject(projectId: number): Promise<Order | undefined> {
    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.projectId, projectId))
      .orderBy(desc(orders.createdAt))
      .limit(1);
    return row;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [row] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return row;
  }

  async createDigitalTwin(data: InsertDigitalTwin): Promise<DigitalTwin> {
    const [row] = await db.insert(digitalTwins).values(data).returning();
    return row;
  }

  async getDigitalTwinByOrder(orderId: number): Promise<DigitalTwin | undefined> {
    const [row] = await db.select().from(digitalTwins).where(eq(digitalTwins.orderId, orderId));
    return row;
  }

  async updateDigitalTwinStatus(id: number, status: string): Promise<DigitalTwin | undefined> {
    const [row] = await db
      .update(digitalTwins)
      .set({ status })
      .where(eq(digitalTwins.id, id))
      .returning();
    return row;
  }

  async createQualificationRecord(
    data: InsertQualificationRecord,
  ): Promise<QualificationRecord> {
    const [row] = await db.insert(qualificationRecords).values(data).returning();
    return row;
  }

  async getQualificationRecordByTwin(
    digitalTwinId: number,
  ): Promise<QualificationRecord | undefined> {
    const [row] = await db
      .select()
      .from(qualificationRecords)
      .where(eq(qualificationRecords.digitalTwinId, digitalTwinId))
      .orderBy(desc(qualificationRecords.createdAt))
      .limit(1);
    return row;
  }
}

export const storage = new DatabaseStorage();

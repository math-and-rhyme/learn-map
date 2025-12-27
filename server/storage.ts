import { db } from "./db";
import {
  roadmaps, nodes,
  type InsertRoadmap, type InsertNode,
  type Roadmap, type Node, type UpdateRoadmapRequest, type UpdateNodeRequest,
  type NodeResponse
} from "@shared/schema";
import { eq, asc, desc, and } from "drizzle-orm";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage";

export interface IStorage extends IAuthStorage {
  // Roadmaps
  getRoadmaps(userId: string): Promise<Roadmap[]>;
  getRoadmap(id: number): Promise<Roadmap | undefined>;
  createRoadmap(roadmap: InsertRoadmap): Promise<Roadmap>;
  updateRoadmap(id: number, updates: UpdateRoadmapRequest): Promise<Roadmap>;
  deleteRoadmap(id: number): Promise<void>;

  // Nodes
  getNodes(roadmapId: number): Promise<Node[]>;
  getNode(id: number): Promise<Node | undefined>;
  createNode(node: InsertNode): Promise<Node>;
  updateNode(id: number, updates: UpdateNodeRequest): Promise<Node>;
  deleteNode(id: number): Promise<void>;
  
  // Custom
  batchUpdateNodes(updates: { id: number; parentId: number | null; order: number }[]): Promise<Node[]>;
}

export class DatabaseStorage extends (authStorage.constructor as new () => IAuthStorage) implements IStorage {
  // Roadmaps
  async getRoadmaps(userId: string): Promise<Roadmap[]> {
    return await db.select()
      .from(roadmaps)
      .where(eq(roadmaps.userId, userId))
      .orderBy(desc(roadmaps.createdAt));
  }

  async getRoadmap(id: number): Promise<Roadmap | undefined> {
    const [roadmap] = await db.select().from(roadmaps).where(eq(roadmaps.id, id));
    return roadmap;
  }

  async createRoadmap(roadmap: InsertRoadmap): Promise<Roadmap> {
    const [created] = await db.insert(roadmaps).values(roadmap).returning();
    
    // Create default root node "Intro" as per requirements
    await this.createNode({
      roadmapId: created.id,
      title: "Intro",
      type: "other",
      status: "not_started",
      parentId: null,
      order: 0
    });
    
    return created;
  }

  async updateRoadmap(id: number, updates: UpdateRoadmapRequest): Promise<Roadmap> {
    const [updated] = await db
      .update(roadmaps)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(roadmaps.id, id))
      .returning();
    return updated;
  }

  async deleteRoadmap(id: number): Promise<void> {
    await db.delete(roadmaps).where(eq(roadmaps.id, id));
  }

  // Nodes
  async getNodes(roadmapId: number): Promise<Node[]> {
    return await db.select()
      .from(nodes)
      .where(eq(nodes.roadmapId, roadmapId))
      .orderBy(asc(nodes.order), asc(nodes.createdAt));
  }

  async getNode(id: number): Promise<Node | undefined> {
    const [node] = await db.select().from(nodes).where(eq(nodes.id, id));
    return node;
  }

  async createNode(node: InsertNode): Promise<Node> {
    const [created] = await db.insert(nodes).values(node).returning();
    return created;
  }

  async updateNode(id: number, updates: UpdateNodeRequest): Promise<Node> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    
    // Auto-update completedAt if status changes to completed
    if (updates.status === 'completed' && !updates.completedAt) {
      updateData.completedAt = new Date();
    } else if (updates.status && updates.status !== 'completed') {
      updateData.completedAt = null;
    }

    const [updated] = await db
      .update(nodes)
      .set(updateData)
      .where(eq(nodes.id, id))
      .returning();
    return updated;
  }

  async deleteNode(id: number): Promise<void> {
    await db.delete(nodes).where(eq(nodes.id, id));
  }

  async batchUpdateNodes(updates: { id: number; parentId: number | null; order: number }[]): Promise<Node[]> {
    const results: Node[] = [];
    
    // Execute updates transactionally or sequentially
    // Since Drizzle simple batching isn't always available depending on driver, loop is safe for small batches
    for (const update of updates) {
      const [updated] = await db
        .update(nodes)
        .set({
          parentId: update.parentId,
          order: update.order,
          updatedAt: new Date()
        })
        .where(eq(nodes.id, update.id))
        .returning();
      results.push(updated);
    }
    
    return results;
  }
}

export const storage = new DatabaseStorage();

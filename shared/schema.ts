import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// === TABLE DEFINITIONS ===
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const roadmaps = sqliteTable("roadmaps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dailyFocusTime: integer("daily_focus_time").default(60), // in minutes
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const nodes = sqliteTable("nodes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roadmapId: integer("roadmap_id").notNull(),
  parentId: integer("parent_id"),
  title: text("title").notNull(),
  type: text("type").notNull().default("other"),
  topic: text("topic"),
  resourceUrl: text("resource_url"),
  timeEstimate: integer("time_estimate").default(0), // in minutes
  status: text("status").notNull().default("not_started"),
  content: text("content"), // Markdown notes
  order: integer("order").default(0), // For sorting siblings
  completedAt: text("completed_at"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// === BASE SCHEMAS ===
export const insertRoadmapSchema = createInsertSchema(roadmaps).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertNodeSchema = createInsertSchema(nodes).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  completedAt: true 
});

// === EXPLICIT API CONTRACT TYPES ===

// Base types
export type Roadmap = typeof roadmaps.$inferSelect;
export type InsertRoadmap = z.infer<typeof insertRoadmapSchema>;
export type Node = typeof nodes.$inferSelect;
export type InsertNode = z.infer<typeof insertNodeSchema>;

// Request types
export type CreateRoadmapRequest = InsertRoadmap;
export type UpdateRoadmapRequest = Partial<InsertRoadmap>;
export type CreateNodeRequest = InsertNode;
export type UpdateNodeRequest = Partial<InsertNode>;
export type ReorderNodesRequest = {
  nodeIds: number[];
  parentId: number | null;
};

// Response types
export type RoadmapResponse = Roadmap & {
  completionPercentage?: number;
  totalTimeEstimate?: number;
  totalTimeLogged?: number;
};

export type NodeResponse = Node & {
  children?: NodeResponse[];
};

// import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
// import { createInsertSchema } from "drizzle-zod";
// import { z } from "zod";
// import { users } from "./models/auth";
// import { relations } from "drizzle-orm";

// // Re-export auth models
// export * from "./models/auth";

// // === ENUMS ===
// export const nodeTypeEnum = pgEnum("node_type", [
//   "article",
//   "book",
//   "video",
//   "course",
//   "project",
//   "other"
// ]);

// export const nodeStatusEnum = pgEnum("node_status", [
//   "not_started",
//   "in_progress",
//   "completed"
// ]);

// // === TABLE DEFINITIONS ===
// export const roadmaps = pgTable("roadmaps", {
//   id: serial("id").primaryKey(),
//   userId: text("user_id").notNull().references(() => users.id),
//   title: text("title").notNull(),
//   description: text("description"),
//   dailyFocusTime: integer("daily_focus_time").default(60), // in minutes
//   createdAt: timestamp("created_at").defaultNow(),
//   updatedAt: timestamp("updated_at").defaultNow(),
// });

// export const nodes = pgTable("nodes", {
//   id: serial("id").primaryKey(),
//   roadmapId: integer("roadmap_id").notNull().references(() => roadmaps.id, { onDelete: "cascade" }),
//   parentId: integer("parent_id"), // Self-reference for hierarchy
//   title: text("title").notNull(),
//   type: nodeTypeEnum("type").default("other").notNull(),
//   topic: text("topic"),
//   resourceUrl: text("resource_url"),
//   timeEstimate: integer("time_estimate").default(0), // in minutes
//   status: nodeStatusEnum("status").default("not_started").notNull(),
//   content: text("content"), // Markdown notes
//   order: integer("order").default(0), // For sorting siblings
//   completedAt: timestamp("completed_at"),
//   createdAt: timestamp("created_at").defaultNow(),
//   updatedAt: timestamp("updated_at").defaultNow(),
// });

// // === RELATIONS ===
// export const roadmapsRelations = relations(roadmaps, ({ one, many }) => ({
//   user: one(users, {
//     fields: [roadmaps.userId],
//     references: [users.id],
//   }),
//   nodes: many(nodes),
// }));

// export const nodesRelations = relations(nodes, ({ one, many }) => ({
//   roadmap: one(roadmaps, {
//     fields: [nodes.roadmapId],
//     references: [roadmaps.id],
//   }),
//   parent: one(nodes, {
//     fields: [nodes.parentId],
//     references: [nodes.id],
//     relationName: "parent_child",
//   }),
//   children: many(nodes, {
//     relationName: "parent_child",
//   }),
// }));

// // === BASE SCHEMAS ===
// export const insertRoadmapSchema = createInsertSchema(roadmaps).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertNodeSchema = createInsertSchema(nodes).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });

// // === EXPLICIT API CONTRACT TYPES ===

// // Base types
// export type Roadmap = typeof roadmaps.$inferSelect;
// export type InsertRoadmap = z.infer<typeof insertRoadmapSchema>;
// export type Node = typeof nodes.$inferSelect;
// export type InsertNode = z.infer<typeof insertNodeSchema>;

// // Request types
// export type CreateRoadmapRequest = InsertRoadmap;
// export type UpdateRoadmapRequest = Partial<InsertRoadmap>;
// export type CreateNodeRequest = InsertNode;
// export type UpdateNodeRequest = Partial<InsertNode>;
// export type ReorderNodesRequest = {
//   nodeIds: number[];
//   parentId: number | null;
// };

// // Response types
// export type RoadmapResponse = Roadmap & {
//   completionPercentage?: number;
//   totalTimeEstimate?: number;
//   totalTimeLogged?: number;
// };

// export type NodeResponse = Node & {
//   children?: NodeResponse[];
// };

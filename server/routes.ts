import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  // Roadmaps
  app.get(api.roadmaps.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const roadmaps = await storage.getRoadmaps((req.user as any).claims.sub);
    res.json(roadmaps);
  });

  app.get(api.roadmaps.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const roadmap = await storage.getRoadmap(Number(req.params.id));
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
    if (roadmap.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });
    res.json(roadmap);
  });

  app.post(api.roadmaps.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.roadmaps.create.input.parse({
        ...req.body,
        userId: (req.user as any).claims.sub
      });
      const roadmap = await storage.createRoadmap(input);
      res.status(201).json(roadmap);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.roadmaps.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const roadmap = await storage.getRoadmap(Number(req.params.id));
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
    if (roadmap.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

    try {
      const input = api.roadmaps.update.input.parse(req.body);
      const updated = await storage.updateRoadmap(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.roadmaps.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const roadmap = await storage.getRoadmap(Number(req.params.id));
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
    if (roadmap.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteRoadmap(Number(req.params.id));
    res.status(204).send();
  });

  // Nodes
  app.get(api.nodes.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const roadmap = await storage.getRoadmap(Number(req.params.roadmapId));
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
    if (roadmap.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

    const nodes = await storage.getNodes(Number(req.params.roadmapId));
    res.json(nodes);
  });

  app.post(api.nodes.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const roadmap = await storage.getRoadmap(Number(req.params.roadmapId));
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
    if (roadmap.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

    try {
      const input = api.nodes.create.input.parse({
        ...req.body,
        roadmapId: Number(req.params.roadmapId)
      });
      const node = await storage.createNode(input);
      res.status(201).json(node);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.nodes.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const node = await storage.getNode(Number(req.params.id));
    if (!node) return res.status(404).json({ message: "Node not found" });
    
    // Verify ownership via roadmap
    const roadmap = await storage.getRoadmap(node.roadmapId);
    if (!roadmap || roadmap.userId !== (req.user as any).claims.sub) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const input = api.nodes.update.input.parse(req.body);
      const updated = await storage.updateNode(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.nodes.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const node = await storage.getNode(Number(req.params.id));
    if (!node) return res.status(404).json({ message: "Node not found" });
    
    // Verify ownership via roadmap
    const roadmap = await storage.getRoadmap(node.roadmapId);
    if (!roadmap || roadmap.userId !== (req.user as any).claims.sub) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await storage.deleteNode(Number(req.params.id));
    res.status(204).send();
  });

  app.post(api.nodes.reorder.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const roadmap = await storage.getRoadmap(Number(req.params.roadmapId));
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
    if (roadmap.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

    try {
      const { updates } = api.nodes.reorder.input.parse(req.body);
      const updatedNodes = await storage.batchUpdateNodes(updates);
      res.json(updatedNodes);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

// Default user ID for local development
const DEFAULT_USER_ID = "local-dev-user";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Roadmaps
  app.get(api.roadmaps.list.path, async (req, res) => {
    const roadmaps = await storage.getRoadmaps(DEFAULT_USER_ID);
    res.json(roadmaps);
  });

  app.get(api.roadmaps.get.path, async (req, res) => {
    const roadmap = await storage.getRoadmap(Number(req.params.id));
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
    res.json(roadmap);
  });

  app.post(api.roadmaps.create.path, async (req, res) => {
    try {
      const input = api.roadmaps.create.input.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
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
    const roadmap = await storage.getRoadmap(Number(req.params.id));
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });

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
    const roadmap = await storage.getRoadmap(Number(req.params.id));
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });

    await storage.deleteRoadmap(Number(req.params.id));
    res.status(204).send();
  });

  // Nodes
  app.get(api.nodes.list.path, async (req, res) => {
    const roadmap = await storage.getRoadmap(Number(req.params.roadmapId));
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });

    const nodes = await storage.getNodes(Number(req.params.roadmapId));
    res.json(nodes);
  });

  app.post(api.nodes.create.path, async (req, res) => {
    const roadmap = await storage.getRoadmap(Number(req.params.roadmapId));
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });

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
    const node = await storage.getNode(Number(req.params.id));
    if (!node) return res.status(404).json({ message: "Node not found" });

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

  // Add this route after your other node routes
  app.post('/api/roadmaps/:roadmapId/nodes/batch', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const roadmapId = Number(req.params.roadmapId);
    const roadmap = await storage.getRoadmap(roadmapId);
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
    if (roadmap.userId !== (req.user as any).claims.sub) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const nodesData = req.body; // Should be an array
      
      const createdNodes = [];
      for (const nodeData of nodesData) {
        const { parentTitle, ...nodeInput } = nodeData;
        
        // Create the node
        const node = await storage.createNode({
          ...nodeInput,
          roadmapId,
        });
        
        // Store with parentTitle for later linking
        createdNodes.push({ ...node, parentTitle });
      }
      
      // Second pass: link parent-child relationships
      for (const node of createdNodes) {
        if (node.parentTitle) {
          const parentNode = createdNodes.find(n => 
            n.title === node.parentTitle && n.id !== node.id
          );
          if (parentNode) {
            await storage.updateNode(node.id, { parentId: parentNode.id });
          }
        }
      }
      
      res.status(201).json({ 
        success: true, 
        count: createdNodes.length,
        message: `Created ${createdNodes.length} nodes`
      });
      
    } catch (err: any) {
      console.error("Batch create error:", err);
      res.status(400).json({ 
        message: "Failed to create nodes", 
        error: err.message 
      });
    }
  });

  app.delete(api.nodes.delete.path, async (req, res) => {
    const node = await storage.getNode(Number(req.params.id));
    if (!node) return res.status(404).json({ message: "Node not found" });

    await storage.deleteNode(Number(req.params.id));
    res.status(204).send();
  });

  app.post(api.nodes.reorder.path, async (req, res) => {
    const roadmap = await storage.getRoadmap(Number(req.params.roadmapId));
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });

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

// import type { Express } from "express";
// import { createServer, type Server } from "http";
// import { storage } from "./storage";
// import { api } from "@shared/routes";
// import { z } from "zod";
// import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

// export async function registerRoutes(
//   httpServer: Server,
//   app: Express
// ): Promise<Server> {
//   // Setup Auth first
//   await setupAuth(app);
//   registerAuthRoutes(app);

//   // Roadmaps
//   app.get(api.roadmaps.list.path, async (req, res) => {
//     if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
//     const roadmaps = await storage.getRoadmaps((req.user as any).claims.sub);
//     res.json(roadmaps);
//   });

//   app.get(api.roadmaps.get.path, async (req, res) => {
//     if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
//     const roadmap = await storage.getRoadmap(Number(req.params.id));
//     if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
//     if (roadmap.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });
//     res.json(roadmap);
//   });

//   app.post(api.roadmaps.create.path, async (req, res) => {
//     if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
//     try {
//       const input = api.roadmaps.create.input.parse({
//         ...req.body,
//         userId: (req.user as any).claims.sub
//       });
//       const roadmap = await storage.createRoadmap(input);
//       res.status(201).json(roadmap);
//     } catch (err) {
//       if (err instanceof z.ZodError) {
//         return res.status(400).json({ message: err.errors[0].message });
//       }
//       throw err;
//     }
//   });

//   app.patch(api.roadmaps.update.path, async (req, res) => {
//     if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
//     const roadmap = await storage.getRoadmap(Number(req.params.id));
//     if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
//     if (roadmap.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

//     try {
//       const input = api.roadmaps.update.input.parse(req.body);
//       const updated = await storage.updateRoadmap(Number(req.params.id), input);
//       res.json(updated);
//     } catch (err) {
//       if (err instanceof z.ZodError) {
//         return res.status(400).json({ message: err.errors[0].message });
//       }
//       throw err;
//     }
//   });

//   app.delete(api.roadmaps.delete.path, async (req, res) => {
//     if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
//     const roadmap = await storage.getRoadmap(Number(req.params.id));
//     if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
//     if (roadmap.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

//     await storage.deleteRoadmap(Number(req.params.id));
//     res.status(204).send();
//   });

//   // Nodes
//   app.get(api.nodes.list.path, async (req, res) => {
//     if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
//     const roadmap = await storage.getRoadmap(Number(req.params.roadmapId));
//     if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
//     if (roadmap.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

//     const nodes = await storage.getNodes(Number(req.params.roadmapId));
//     res.json(nodes);
//   });

//   app.post(api.nodes.create.path, async (req, res) => {
//     if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
//     const roadmap = await storage.getRoadmap(Number(req.params.roadmapId));
//     if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
//     if (roadmap.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

//     try {
//       const input = api.nodes.create.input.parse({
//         ...req.body,
//         roadmapId: Number(req.params.roadmapId)
//       });
//       const node = await storage.createNode(input);
//       res.status(201).json(node);
//     } catch (err) {
//       if (err instanceof z.ZodError) {
//         return res.status(400).json({ message: err.errors[0].message });
//       }
//       throw err;
//     }
//   });

//   app.patch(api.nodes.update.path, async (req, res) => {
//     if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
//     const node = await storage.getNode(Number(req.params.id));
//     if (!node) return res.status(404).json({ message: "Node not found" });
    
//     // Verify ownership via roadmap
//     const roadmap = await storage.getRoadmap(node.roadmapId);
//     if (!roadmap || roadmap.userId !== (req.user as any).claims.sub) {
//       return res.status(403).json({ message: "Forbidden" });
//     }

//     try {
//       const input = api.nodes.update.input.parse(req.body);
//       const updated = await storage.updateNode(Number(req.params.id), input);
//       res.json(updated);
//     } catch (err) {
//       if (err instanceof z.ZodError) {
//         return res.status(400).json({ message: err.errors[0].message });
//       }
//       throw err;
//     }
//   });

//   app.delete(api.nodes.delete.path, async (req, res) => {
//     if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
//     const node = await storage.getNode(Number(req.params.id));
//     if (!node) return res.status(404).json({ message: "Node not found" });
    
//     // Verify ownership via roadmap
//     const roadmap = await storage.getRoadmap(node.roadmapId);
//     if (!roadmap || roadmap.userId !== (req.user as any).claims.sub) {
//       return res.status(403).json({ message: "Forbidden" });
//     }

//     await storage.deleteNode(Number(req.params.id));
//     res.status(204).send();
//   });

//   app.post(api.nodes.reorder.path, async (req, res) => {
//     if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
//     const roadmap = await storage.getRoadmap(Number(req.params.roadmapId));
//     if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
//     if (roadmap.userId !== (req.user as any).claims.sub) return res.status(403).json({ message: "Forbidden" });

//     try {
//       const { updates } = api.nodes.reorder.input.parse(req.body);
//       const updatedNodes = await storage.batchUpdateNodes(updates);
//       res.json(updatedNodes);
//     } catch (err) {
//       if (err instanceof z.ZodError) {
//         return res.status(400).json({ message: err.errors[0].message });
//       }
//       throw err;
//     }
//   });

//   return httpServer;
// }

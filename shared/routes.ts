import { z } from 'zod';
import { insertRoadmapSchema, insertNodeSchema, roadmaps, nodes } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  roadmaps: {
    list: {
      method: 'GET' as const,
      path: '/api/roadmaps',
      responses: {
        200: z.array(z.custom<typeof roadmaps.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/roadmaps/:id',
      responses: {
        200: z.custom<typeof roadmaps.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/roadmaps',
      input: insertRoadmapSchema,
      responses: {
        201: z.custom<typeof roadmaps.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/roadmaps/:id',
      input: insertRoadmapSchema.partial(),
      responses: {
        200: z.custom<typeof roadmaps.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/roadmaps/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  nodes: {
    list: {
      method: 'GET' as const,
      path: '/api/roadmaps/:roadmapId/nodes',
      responses: {
        200: z.array(z.custom<typeof nodes.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/roadmaps/:roadmapId/nodes',
      input: insertNodeSchema,
      responses: {
        201: z.custom<typeof nodes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/nodes/:id',
      input: insertNodeSchema.partial(),
      responses: {
        200: z.custom<typeof nodes.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/nodes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    reorder: {
      method: 'POST' as const,
      path: '/api/roadmaps/:roadmapId/reorder',
      input: z.object({
        updates: z.array(z.object({
          id: z.number(),
          parentId: z.number().nullable(),
          order: z.number()
        }))
      }),
      responses: {
        200: z.array(z.custom<typeof nodes.$inferSelect>()),
      },
    }
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type RoadmapInput = z.infer<typeof api.roadmaps.create.input>;
export type NodeInput = z.infer<typeof api.nodes.create.input>;
export type NodeReorderInput = z.infer<typeof api.nodes.reorder.input>;

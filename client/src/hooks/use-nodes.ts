import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type NodeInput, type NodeReorderInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useNodes(roadmapId: number) {
  return useQuery({
    queryKey: [api.nodes.list.path, roadmapId],
    enabled: !!roadmapId,
    queryFn: async () => {
      const url = buildUrl(api.nodes.list.path, { roadmapId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch nodes");
      return api.nodes.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateNode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ roadmapId, data }: { roadmapId: number; data: NodeInput }) => {
      const url = buildUrl(api.nodes.create.path, { roadmapId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = api.nodes.create.responses[400].parse(await res.json());
          throw new Error(err.message);
        }
        throw new Error("Failed to create node");
      }
      return api.nodes.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.nodes.list.path, data.roadmapId] });
      toast({ title: "Created", description: "Node added to roadmap" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}

export function useUpdateNode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<NodeInput>) => {
      const url = buildUrl(api.nodes.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update node");
      return api.nodes.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.nodes.list.path, data.roadmapId] });
      toast({ title: "Saved", description: "Changes saved successfully" });
    },
  });
}

export function useDeleteNode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, roadmapId }: { id: number; roadmapId: number }) => {
      const url = buildUrl(api.nodes.delete.path, { id });
      const res = await fetch(url, { 
        method: "DELETE",
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to delete node");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.nodes.list.path, variables.roadmapId] });
      toast({ title: "Deleted", description: "Node removed from roadmap" });
    },
  });
}

export function useReorderNodes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ roadmapId, updates }: { roadmapId: number; updates: NodeReorderInput['updates'] }) => {
      const url = buildUrl(api.nodes.reorder.path, { roadmapId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to reorder nodes");
      return api.nodes.reorder.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Optimistic update would be better here, but invalidating is safer for MVP
      queryClient.invalidateQueries({ queryKey: [api.nodes.list.path, variables.roadmapId] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save order", variant: "destructive" });
    }
  });
}

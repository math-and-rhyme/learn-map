import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type RoadmapInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useRoadmaps() {
  return useQuery({
    queryKey: [api.roadmaps.list.path],
    queryFn: async () => {
      const url = buildUrl(api.roadmaps.list.path);
      const res = await fetch(url); // Removed credentials: "include"
      if (!res.ok) throw new Error("Failed to fetch roadmaps");
      return api.roadmaps.list.responses[200].parse(await res.json());
    },
  });
}

export function useRoadmap(id: number) {
  return useQuery({
    queryKey: [api.roadmaps.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      const url = buildUrl(api.roadmaps.get.path, { id });
      const res = await fetch(url); // Removed credentials: "include"
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch roadmap");
      return api.roadmaps.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateRoadmap() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RoadmapInput) => {
      const url = buildUrl(api.roadmaps.create.path);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        // Removed credentials: "include"
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const err = api.roadmaps.create.responses[400].parse(await res.json());
          throw new Error(err.message);
        }
        throw new Error("Failed to create roadmap");
      }
      return api.roadmaps.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.roadmaps.list.path] });
      toast({ title: "Success", description: "Roadmap created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create roadmap", 
        variant: "destructive" 
      });
    },
  });
}

export function useUpdateRoadmap() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<RoadmapInput>) => {
      const url = buildUrl(api.roadmaps.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        // Removed credentials: "include"
      });

      if (!res.ok) throw new Error("Failed to update roadmap");
      return api.roadmaps.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.roadmaps.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.roadmaps.get.path, data.id] });
      toast({ title: "Updated", description: "Roadmap updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });
}

export function useDeleteRoadmap() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.roadmaps.delete.path, { id });
      const res = await fetch(url, { 
        method: "DELETE",
        // Removed credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete roadmap");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.roadmaps.list.path] });
      toast({ title: "Deleted", description: "Roadmap deleted" });
    },
  });
}

// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { api, buildUrl, type RoadmapInput } from "@shared/routes";
// import { useToast } from "@/hooks/use-toast";

// export function useRoadmaps() {
//   return useQuery({
//     queryKey: [api.roadmaps.list.path],
//     queryFn: async () => {
//       const res = await fetch(api.roadmaps.list.path, { credentials: "include" });
//       if (!res.ok) throw new Error("Failed to fetch roadmaps");
//       return api.roadmaps.list.responses[200].parse(await res.json());
//     },
//   });
// }

// export function useRoadmap(id: number) {
//   return useQuery({
//     queryKey: [api.roadmaps.get.path, id],
//     enabled: !!id,
//     queryFn: async () => {
//       const url = buildUrl(api.roadmaps.get.path, { id });
//       const res = await fetch(url, { credentials: "include" });
//       if (res.status === 404) return null;
//       if (!res.ok) throw new Error("Failed to fetch roadmap");
//       return api.roadmaps.get.responses[200].parse(await res.json());
//     },
//   });
// }

// export function useCreateRoadmap() {
//   const queryClient = useQueryClient();
//   const { toast } = useToast();

//   return useMutation({
//     mutationFn: async (data: RoadmapInput) => {
//       const res = await fetch(api.roadmaps.create.path, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//         credentials: "include",
//       });
      
//       if (!res.ok) {
//         if (res.status === 400) {
//           const err = api.roadmaps.create.responses[400].parse(await res.json());
//           throw new Error(err.message);
//         }
//         throw new Error("Failed to create roadmap");
//       }
//       return api.roadmaps.create.responses[201].parse(await res.json());
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [api.roadmaps.list.path] });
//       toast({ title: "Success", description: "Roadmap created successfully" });
//     },
//     onError: (error) => {
//       toast({ 
//         title: "Error", 
//         description: error.message || "Failed to create roadmap", 
//         variant: "destructive" 
//       });
//     },
//   });
// }

// export function useUpdateRoadmap() {
//   const queryClient = useQueryClient();
//   const { toast } = useToast();

//   return useMutation({
//     mutationFn: async ({ id, ...data }: { id: number } & Partial<RoadmapInput>) => {
//       const url = buildUrl(api.roadmaps.update.path, { id });
//       const res = await fetch(url, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//         credentials: "include",
//       });

//       if (!res.ok) throw new Error("Failed to update roadmap");
//       return api.roadmaps.update.responses[200].parse(await res.json());
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: [api.roadmaps.list.path] });
//       queryClient.invalidateQueries({ queryKey: [api.roadmaps.get.path, data.id] });
//       toast({ title: "Updated", description: "Roadmap updated successfully" });
//     },
//     onError: (error) => {
//       toast({ 
//         title: "Error", 
//         description: error.message, 
//         variant: "destructive" 
//       });
//     }
//   });
// }

// export function useDeleteRoadmap() {
//   const queryClient = useQueryClient();
//   const { toast } = useToast();

//   return useMutation({
//     mutationFn: async (id: number) => {
//       const url = buildUrl(api.roadmaps.delete.path, { id });
//       const res = await fetch(url, { 
//         method: "DELETE",
//         credentials: "include" 
//       });
//       if (!res.ok) throw new Error("Failed to delete roadmap");
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [api.roadmaps.list.path] });
//       toast({ title: "Deleted", description: "Roadmap deleted" });
//     },
//   });
// }

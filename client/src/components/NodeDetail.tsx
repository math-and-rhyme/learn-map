import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type NodeResponse } from "@shared/schema";
import { z } from "zod";
import { useUpdateNode } from "@/hooks/use-nodes";
import { useToast } from "@/hooks/use-toast"; // Add this import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, ExternalLink } from "lucide-react";

// Create a proper form schema with coercion
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["article", "book", "video", "course", "project", "other"]),
  status: z.enum(["not_started", "in_progress", "completed"]),
  timeEstimate: z.coerce.number().int().min(0).default(0),
  resourceUrl: z.string().url().optional().or(z.literal("")),
  content: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function NodeDetail({ node }: { node: NodeResponse }) {
  const { mutate, isPending } = useUpdateNode();
  const { toast } = useToast(); // Initialize toast

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: node.title,
      type: node.type,
      status: node.status,
      timeEstimate: node.timeEstimate || 0,
      resourceUrl: node.resourceUrl || "",
      content: node.content || "",
    }
  });

  // Reset form when node changes
  useEffect(() => {
    reset({
      title: node.title,
      type: node.type,
      status: node.status,
      timeEstimate: node.timeEstimate || 0,
      resourceUrl: node.resourceUrl || "",
      content: node.content || "",
    });
  }, [node.id, reset]);

  const onSubmit = (data: FormValues) => {
    // Log to debug
    console.log("Submitting node update:", {
      id: node.id,
      ...data,
      timeEstimate: data.timeEstimate
    });

    mutate({
      id: node.id,
      ...data
    }, {
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update node",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card className="h-full border-none shadow-none rounded-none bg-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-display">Item Details</CardTitle>
          {node.resourceUrl && (
            <a 
              href={node.resourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Open Resource <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              className="font-medium text-lg"
              {...register("title")} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                onValueChange={(val) => setValue("type", val as any)} 
                defaultValue={node.type}
                key={`type-${node.id}`}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                onValueChange={(val) => setValue("status", val as any)} 
                defaultValue={node.status}
                key={`status-${node.id}`}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Time Estimate (min)
              </Label>
              <Input 
                type="number" 
                min="0"
                step="1"
                {...register("timeEstimate")} 
              />
            </div>

            <div className="space-y-2">
              <Label>Resource URL</Label>
              <Input 
                placeholder="https://..." 
                {...register("resourceUrl")} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes / Content</Label>
            <Textarea 
              className="min-h-[200px] font-mono text-sm leading-relaxed" 
              placeholder="Add your notes, summaries, or key takeaways here..."
              {...register("content")} 
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// import { useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { insertNodeSchema, type NodeResponse } from "@shared/schema";
// import { z } from "zod";
// import { useUpdateNode } from "@/hooks/use-nodes";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Clock, ExternalLink } from "lucide-react";

// const formSchema = insertNodeSchema.pick({
//   title: true,
//   type: true,
//   status: true,
//   timeEstimate: true,
//   resourceUrl: true,
//   content: true,
// });

// type FormValues = z.infer<typeof formSchema>;

// export function NodeDetail({ node }: { node: NodeResponse }) {
//   const { mutate, isPending } = useUpdateNode();
  
//   const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       title: node.title,
//       type: node.type,
//       status: node.status,
//       timeEstimate: node.timeEstimate || 0,
//       resourceUrl: node.resourceUrl || "",
//       content: node.content || "",
//     }
//   });

//   // Reset form when node changes
//   useEffect(() => {
//     reset({
//       title: node.title,
//       type: node.type,
//       status: node.status,
//       timeEstimate: node.timeEstimate || 0,
//       resourceUrl: node.resourceUrl || "",
//       content: node.content || "",
//     });
//   }, [node.id, reset]);

//   // Auto-save on blur logic could be added here, but for now we use a save button
//   const onSubmit = (data: FormValues) => {
//     mutate({
//       id: node.id,
//       ...data,
//       timeEstimate: Number(data.timeEstimate)
//     });
//   };

//   return (
//     <Card className="h-full border-none shadow-none rounded-none bg-transparent">
//       <CardHeader className="pb-4">
//         <div className="flex items-center justify-between">
//           <CardTitle className="text-xl font-display">Item Details</CardTitle>
//           {node.resourceUrl && (
//             <a 
//               href={node.resourceUrl} 
//               target="_blank" 
//               rel="noopener noreferrer"
//               className="text-sm text-primary hover:underline flex items-center gap-1"
//             >
//               Open Resource <ExternalLink className="h-3 w-3" />
//             </a>
//           )}
//         </div>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//           <div className="space-y-2">
//             <Label htmlFor="title">Title</Label>
//             <Input 
//               id="title" 
//               className="font-medium text-lg"
//               {...register("title")} 
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label>Type</Label>
//               <Select 
//                 onValueChange={(val) => setValue("type", val as any)} 
//                 defaultValue={node.type}
//                 key={`type-${node.id}`} // Force re-render on node switch
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select type" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="article">Article</SelectItem>
//                   <SelectItem value="video">Video</SelectItem>
//                   <SelectItem value="book">Book</SelectItem>
//                   <SelectItem value="course">Course</SelectItem>
//                   <SelectItem value="project">Project</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2">
//               <Label>Status</Label>
//               <Select 
//                 onValueChange={(val) => setValue("status", val as any)} 
//                 defaultValue={node.status}
//                 key={`status-${node.id}`}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="not_started">Not Started</SelectItem>
//                   <SelectItem value="in_progress">In Progress</SelectItem>
//                   <SelectItem value="completed">Completed</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label className="flex items-center gap-2">
//                 <Clock className="h-4 w-4" /> Time Estimate (min)
//               </Label>
//               <Input 
//                 type="number" 
//                 {...register("timeEstimate")} 
//               />
//             </div>
            
//             <div className="space-y-2">
//               <Label>Resource URL</Label>
//               <Input 
//                 placeholder="https://..." 
//                 {...register("resourceUrl")} 
//               />
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label>Notes / Content</Label>
//             <Textarea 
//               className="min-h-[200px] font-mono text-sm leading-relaxed" 
//               placeholder="Add your notes, summaries, or key takeaways here..."
//               {...register("content")} 
//             />
//           </div>

//           <div className="flex justify-end pt-4">
//             <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
//               {isPending ? "Saving..." : "Save Changes"}
//             </Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }

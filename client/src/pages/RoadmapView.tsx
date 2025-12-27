import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useRoadmap } from "@/hooks/use-roadmaps";
import { useNodes } from "@/hooks/use-nodes";
import { NodeTree } from "@/components/NodeTree";
import { NodeDetail } from "@/components/NodeDetail";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  PieChart, 
  Clock, 
  CheckCircle,
  Layout
} from "lucide-react";
import { type NodeResponse } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteRoadmap } from "@/hooks/use-roadmaps";
import { useToast } from "@/hooks/use-toast";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";

export default function RoadmapView() {
  const [, params] = useRoute("/roadmap/:id");
  const roadmapId = Number(params?.id);
  
  const { data: roadmap, isLoading: loadingRoadmap } = useRoadmap(roadmapId);
  const { data: nodes, isLoading: loadingNodes } = useNodes(roadmapId);
  
  const [selectedNode, setSelectedNode] = useState<NodeResponse | null>(null);
  const { mutate: deleteRoadmap } = useDeleteRoadmap();
  const { toast } = useToast();

  if (loadingRoadmap || loadingNodes) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold">Roadmap Not Found</h1>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    );
  }

  // Calculate Metrics
  const totalNodes = nodes?.length || 0;
  const completedNodes = nodes?.filter(n => n.status === 'completed').length || 0;
  const progress = totalNodes === 0 ? 0 : Math.round((completedNodes / totalNodes) * 100);
  const totalMinutes = nodes?.reduce((acc, curr) => acc + (curr.timeEstimate || 0), 0) || 0;
  const hours = Math.floor(totalMinutes / 60);

  const handleDelete = () => {
    if (confirm("Are you sure? This action cannot be undone.")) {
      deleteRoadmap(roadmapId, {
        onSuccess: () => window.location.href = "/"
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b flex items-center justify-between px-6 bg-background shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="font-display font-bold text-lg leading-tight">{roadmap.title}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><PieChart className="h-3 w-3" /> {progress}% Complete</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {hours}h {totalMinutes % 60}m Est.</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {completedNodes}/{totalNodes} Items</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
              Delete Roadmap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Tree View */}
        <div className="w-full md:w-1/3 lg:w-1/4 border-r bg-muted/10 flex flex-col min-w-[300px]">
          <div className="p-4 border-b bg-muted/20">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Curriculum</h2>
          </div>
          <ScrollArea className="flex-1 p-4">
            {nodes && (
              <NodeTree 
                nodes={nodes} 
                roadmapId={roadmapId} 
                onSelectNode={setSelectedNode}
                selectedNodeId={selectedNode?.id}
              />
            )}
          </ScrollArea>
        </div>

        {/* Right Panel: Content / Details */}
        <div className="flex-1 bg-background flex flex-col relative">
          {selectedNode ? (
            <div className="h-full overflow-y-auto custom-scrollbar p-6 max-w-3xl mx-auto w-full">
              <NodeDetail key={selectedNode.id} node={selectedNode} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <div className="bg-muted/30 p-6 rounded-full mb-6">
                <Layout className="h-12 w-12 opacity-50" />
              </div>
              <h3 className="text-xl font-medium mb-2 text-foreground">Select an item to view details</h3>
              <p className="max-w-md">
                Click on any item in the curriculum list on the left to edit its details, add notes, or mark it as complete.
              </p>
            </div>
          )}
          
          {/* Mobile Overlay for Tree if needed (Optional for responsiveness) */}
          <div className="md:hidden absolute top-4 left-4">
             {/* Mobile view logic would go here if strictly required, but sidebar collapses on mobile typically */}
          </div>
        </div>
      </div>
    </div>
  );
}

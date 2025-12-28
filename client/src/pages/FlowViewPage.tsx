// FlowViewPage.tsx - Full page version
import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useRoadmap } from "@/hooks/use-roadmaps";
import { useNodes } from "@/hooks/use-nodes";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  PieChart, 
  Clock, 
  CheckCircle,
  Calendar,
  Target,
  Eye,
  Maximize2,
  Minimize2
} from "lucide-react";
import { type NodeResponse } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useDeleteRoadmap } from "@/hooks/use-roadmaps";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  ArrowRight,
  BookOpen, 
  FileText, 
  Video, 
  GraduationCap,
  Package,
  Circle as CircleIcon,
  CheckCircle2
} from "lucide-react";

export default function FlowViewPage() {
  const [, params] = useRoute("/roadmap/:id/flow");
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

  // Calculate metrics
  const totalNodes = nodes?.length || 0;
  const completedNodes = nodes?.filter(n => n.status === 'completed').length || 0;
  const progress = totalNodes === 0 ? 0 : Math.round((completedNodes / totalNodes) * 100);
  
  const totalMinutes = nodes?.reduce((acc, curr) => acc + (curr.timeEstimate || 0), 0) || 0;
  const totalHours = Math.floor(totalMinutes / 60);
  
  const completedMinutes = nodes
    ?.filter(n => n.status === 'completed')
    .reduce((acc, curr) => acc + (curr.timeEstimate || 0), 0) || 0;
  const completedHours = Math.floor(completedMinutes / 60);
  
  const timeProgress = totalMinutes === 0 ? 0 : Math.round((completedMinutes / totalMinutes) * 100);

  const remainingMinutes = totalMinutes - completedMinutes;
  const remainingHours = Math.floor(remainingMinutes / 60);
  
  const dailyFocusTime = roadmap.dailyFocusTime || 60;
  const daysRemaining = dailyFocusTime > 0 
    ? Math.ceil(remainingMinutes / dailyFocusTime) 
    : 0;
  
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + daysRemaining);

  const handleDelete = () => {
    if (confirm("Are you sure? This action cannot be undone.")) {
      deleteRoadmap(roadmapId, {
        onSuccess: () => window.location.href = "/"
      });
    }
  };

  // Build flow tree
  const tree = buildFlowTree(nodes || []);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-indigo-50 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-white/50 bg-white/80 backdrop-blur flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link href={`/roadmap/${roadmapId}`}>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="font-display font-bold text-lg leading-tight">{roadmap.title}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> Flow View
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> {completedNodes}/{totalNodes} done
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href={`/roadmap/${roadmapId}/tree`}>
            <Button variant="outline" size="sm" className="gap-2">
              Tree View
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/roadmap/${roadmapId}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Edit View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                Delete Roadmap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Progress Metrics */}
      <div className="border-b border-white/50 bg-white/60 backdrop-blur px-6 py-3 shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <PieChart className="h-4 w-4" />
                <span>Item Progress</span>
              </div>
              <div className="text-xl font-bold">{progress}%</div>
              <Progress value={progress} className="h-2 mt-2" />
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span>Time Progress</span>
              </div>
              <div className="text-xl font-bold">{timeProgress}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {completedHours}h out of {totalHours}h
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span>Days Remaining</span>
              </div>
              <div className="text-xl font-bold">{daysRemaining}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {remainingHours}h remaining
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span>Est. Completion</span>
              </div>
              <div className="text-xl font-bold">
                {projectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {dailyFocusTime}m per day
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flow Visualization Area */}
      <div className="flex-1 overflow-auto p-6">
        {tree.length > 0 ? (
          <div className="flex flex-col items-center min-w-max mx-auto">
            {tree.map((level, levelIndex) => (
              <div key={levelIndex} className="flex items-center justify-center gap-8 mb-8">
                {level.map((node, nodeIndex) => (
                  <FlowNode
                    key={node.id}
                    node={node}
                    level={levelIndex}
                    isFirst={nodeIndex === 0}
                    isLast={nodeIndex === level.length - 1}
                    onSelect={setSelectedNode}
                    isSelected={selectedNode?.id === node.id}
                  />
                ))}
              </div>
            ))}
            
            {/* Legend */}
            <div className="mt-12 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm">
              <h4 className="font-medium text-sm mb-2">Flow View Legend</h4>
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 text-primary" />
                  <span>Sequential flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Completed item</span>
                </div>
                <div className="flex items-center gap-2">
                  <CircleIcon className="h-3 w-3 text-gray-300" />
                  <span>Not started</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary/10 border border-primary/50 rounded"></div>
                  <span>Selected item</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">No nodes yet</h3>
            <p className="max-w-md text-center mb-6">
              Add some learning items in the edit view to see your flow visualization.
            </p>
            <Link href={`/roadmap/${roadmapId}`}>
              <Button>Go to Edit View</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// FlowNode component
function FlowNode({ node, level, isFirst, isLast, onSelect, isSelected }: {
  node: NodeResponse;
  level: number;
  isFirst: boolean;
  isLast: boolean;
  onSelect: (node: NodeResponse) => void;
  isSelected: boolean;
}) {
  const Icon = getNodeIcon(node.type);
  const timeEstimate = node.timeEstimate || 0;
  const hours = Math.floor(timeEstimate / 60);
  const minutes = timeEstimate % 60;
  
  return (
    <div className="flex flex-col items-center">
      {/* Arrow from previous node */}
      {!isFirst && (
        <div className="w-16 h-px bg-primary/30 mb-4 relative">
          <ArrowRight className="h-4 w-4 text-primary absolute -top-2 right-0" />
        </div>
      )}
      
      {/* Node card */}
      <div 
        className={cn(
          "relative p-4 rounded-lg border shadow-sm cursor-pointer transition-all w-48 min-h-[120px] flex flex-col group",
          isSelected 
            ? "bg-primary/5 border-primary shadow-md ring-2 ring-primary/20" 
            : "bg-white hover:shadow-md hover:border-primary/50",
          node.status === 'completed' && "border-green-200 bg-green-50/30"
        )}
        onClick={() => onSelect(node)}
      >
        {/* Status indicator */}
        <div className="absolute -top-2 -right-2">
          {node.status === 'completed' ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 bg-white rounded-full shadow-sm" />
          ) : (
            <CircleIcon className="h-5 w-5 text-gray-300 bg-white rounded-full shadow-sm" />
          )}
        </div>
        
        {/* Node type icon */}
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {node.type}
          </span>
        </div>
        
        {/* Title */}
        <h4 className="font-medium text-sm mb-2 line-clamp-2">
          {node.title}
        </h4>
        
        {/* Time estimate */}
        {timeEstimate > 0 && (
          <div className="mt-auto text-xs text-muted-foreground">
            ⏱️ {hours > 0 ? `${hours}h ` : ''}
            {minutes > 0 ? `${minutes}m` : hours === 0 ? '0m' : ''}
          </div>
        )}
      </div>
      
      {/* Level indicator */}
      <div className="text-xs text-muted-foreground mt-2 bg-white/80 px-2 py-1 rounded-full">
        Level {level + 1}
      </div>
    </div>
  );
}

// Helper functions
function buildFlowTree(nodes: NodeResponse[]): NodeResponse[][] {
  const levels: NodeResponse[][] = [];
  const processed = new Set<number>();
  
  let currentLevel = nodes.filter(n => !n.parentId);
  let levelIndex = 0;
  
  while (currentLevel.length > 0) {
    levels[levelIndex] = currentLevel;
    currentLevel.forEach(node => processed.add(node.id));
    
    const nextLevel: NodeResponse[] = [];
    currentLevel.forEach(node => {
      const children = nodes.filter(n => n.parentId === node.id && !processed.has(n.id));
      nextLevel.push(...children);
    });
    
    currentLevel = nextLevel;
    levelIndex++;
  }
  
  return levels;
}

function getNodeIcon(type: string) {
  switch (type) {
    case 'video': return Video;
    case 'book': return BookOpen;
    case 'course': return GraduationCap;
    case 'article': return FileText;
    case 'project': return Package;
    default: return FileText;
  }
}
import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useRoadmap } from "@/hooks/use-roadmaps";
import { useNodes } from "@/hooks/use-nodes";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Node } from "@shared/schema";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  PieChart, 
  Clock, 
  CheckCircle,
  Calendar,
  Target,
  Eye,
  ListTree,
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

export default function TreeViewPage() {
  const [, params] = useRoute("/roadmap/:id/tree");
  const roadmapId = Number(params?.id);
  
  const { data: roadmap, isLoading: loadingRoadmap } = useRoadmap(roadmapId);
  const { data: nodes, isLoading: loadingNodes } = useNodes(roadmapId);
  
  const [selectedNode, setSelectedNode] = useState<NodeResponse | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
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
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMinutesRemainder = totalMinutes % 60;

  const completedMinutes = nodes
    ?.filter(n => n.status === 'completed')
    .reduce((acc, curr) => acc + (curr.timeEstimate || 0), 0) || 0;
  const completedHours = Math.floor(completedMinutes / 60);
  const completedMinutesRemainder = completedMinutes % 60;
  
  const timeProgress = totalMinutes === 0 ? 0 : Math.round((completedMinutes / totalMinutes) * 100);

  const remainingMinutes = totalMinutes - completedMinutes;
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingMinutesRemainder = remainingMinutes % 60;

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

  // Build tree structure
  const treeData = buildTree(nodes || []);
  
  // Pan and zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.min(Math.max(0.5, prev * delta), 3));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsPanning(true);
      document.body.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    document.body.style.cursor = 'default';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
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
                <ListTree className="h-3 w-3" /> Tree View
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> {completedNodes}/{totalNodes} done
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-1 border">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
              disabled={zoom <= 0.5}
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
              disabled={zoom >= 3}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>

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

      {/* Progress Metrics Bar */}
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
                {remainingHours}h {remainingMinutesRemainder}m left
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

      {/* Main Tree Visualization Area */}
      <div 
        className="flex-1 relative overflow-auto"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        {/* Zoom/pan container */}
        <div 
          className="absolute inset-0"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center'
          }}
        >
          {/* Tree visualization */}
          <div className="p-12 min-w-full min-h-full flex items-center justify-center">
            {treeData.length > 0 ? (
              <div className="relative">
                {/* Tree visualization */}
                <div className="flex flex-col items-center">
                  {treeData.map((node, index) => (
                    <TreeNodeComponent
                      key={node.id}
                      node={node}
                      level={0}
                      isFirst={index === 0}
                      isLast={index === treeData.length - 1}
                      onSelect={setSelectedNode}
                      isSelected={selectedNode?.id === node.id}
                    />
                  ))}
                </div>
                
                {/* Instructions overlay */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border shadow-lg max-w-xs">
                  <p className="text-sm text-muted-foreground">
                    <strong>Navigation:</strong>
                  </p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• <kbd className="px-1 bg-gray-100 rounded">Ctrl+Scroll</kbd> to zoom</li>
                    <li>• <kbd className="px-1 bg-gray-100 rounded">Ctrl+Drag</kbd> to pan</li>
                    <li>• Click nodes to highlight</li>
                    <li>• Click branch lines to collapse/expand</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <ListTree className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">No nodes yet</h3>
                <p className="max-w-md">
                  Add some learning items in the edit view to see your tree visualization.
                </p>
                <Link href={`/roadmap/${roadmapId}`}>
                  <Button className="mt-4">Go to Edit View</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Update the buildTree function to use proper types
function buildTree(nodes: NodeResponse[]): (NodeResponse & { children?: NodeResponse[] })[] {
  const nodeMap = new Map<number, NodeResponse & { children?: NodeResponse[] }>();
  const rootNodes: (NodeResponse & { children?: NodeResponse[] })[] = [];

  // Create map
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // Build tree
  nodes.forEach(node => {
    const treeNode = nodeMap.get(node.id)!;
    
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parent = nodeMap.get(node.parentId)!;
      if (!parent.children) parent.children = [];
      parent.children.push(treeNode);
    } else {
      rootNodes.push(treeNode);
    }
  });

  // Sort by order
  const sortTree = (nodes: (NodeResponse & { children?: NodeResponse[] })[]) => {
    nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
    nodes.forEach(node => {
      if (node.children) {
        sortTree(node.children);
      }
    });
  };

  sortTree(rootNodes);
  return rootNodes;
}

// TreeNode component with proper typing
function TreeNodeComponent({ 
  node, 
  level, 
  isFirst, 
  isLast, 
  onSelect, 
  isSelected 
}: { 
  node: NodeResponse & { children: NodeResponse[] };
  level: number;
  isFirst: boolean;
  isLast: boolean;
  onSelect: (node: NodeResponse) => void;
  isSelected: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  const handleClick = () => {
    console.log("Node clicked:", node.id, node.title);
    onSelect(node);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Expand clicked for:", node.id);
    setExpanded(!expanded);
  };

  return (
    <div className="flex flex-col items-center my-4">
      {/* Vertical line from parent (if not root) */}
      {level > 0 && (
        <div className="w-px h-8 bg-blue-300/50" />
      )}

      {/* Node container */}
      <div className="relative flex items-center">
        {/* Left connecting line
        {!isFirst && (
          <div className="w-16 h-px bg-blue-300/50" />
        )} */}

        {/* Node card */}
        <div
          className={cn(
            "relative p-4 rounded-xl border-2 shadow-lg cursor-pointer transition-all duration-200",
            "min-w-[200px] bg-white hover:shadow-xl hover:-translate-y-1",
            isSelected 
              ? "border-blue-500 shadow-blue-100 bg-blue-50/50" 
              : "border-white bg-gradient-to-br from-white to-gray-50/50",
            node.status === 'completed' && "border-green-200 bg-green-50/30"
          )}
          onClick={handleClick}
        >
          {/* Status indicator */}
          <div className={cn(
            "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center",
            node.status === 'completed' 
              ? "bg-green-500 text-white" 
              : "bg-gray-200 text-gray-600"
          )}>
            {node.status === 'completed' ? '✓' : '○'}
          </div>

          {/* Expand/collapse button for parent nodes */}
          {hasChildren && (
            <button
              onClick={handleExpandClick}
              className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md hover:bg-blue-600 transition-colors z-10"
            >
              {expanded ? '−' : '+'}
            </button>
          )}

          {/* Node content */}
          <div className="text-center">
            <div className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
              {node.type}
            </div>
            <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">
              {node.title}
            </h4>
            
            {/* Time estimate */}
            {(node.timeEstimate || 0) > 0 && (
              <div className="text-sm text-gray-600 mb-2">
                ⏱️ {Math.floor((node.timeEstimate || 0) / 60)}h {(node.timeEstimate || 0) % 60}m
              </div>
            )}

            {/* Children count */}
            {hasChildren && (
              <div className="text-xs text-gray-500">
                {node.children.length} subtopics
              </div>
            )}
          </div>
        </div>

        {/* Right connecting line
        {!isLast && (
          <div className="w-16 h-px bg-blue-300/50" />
        )} */}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="mt-8 relative">
          {/* Horizontal connector line */}
          <div className="absolute left-1/2 top-0 w-px h-8 bg-blue-300/30" />
          
          {/* Children container */}
          <div className="flex items-start gap-8 pt-8">
            {node.children.map((child, index) => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                level={level + 1}
                isFirst={index === 0}
                isLast={index === node.children.length - 1}
                onSelect={onSelect}
                isSelected={isSelected}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// // TreeNode component with visual connections
// function TreeNodeComponent({ 
//   node, 
//   level, 
//   isFirst, 
//   isLast, 
//   onSelect, 
//   isSelected 
// }: { 
//   node: any;
//   level: number;
//   isFirst: boolean;
//   isLast: boolean;
//   onSelect: (node: any) => void;
//   isSelected: boolean;
// }) {
//   const [expanded, setExpanded] = useState(true);
//   const hasChildren = node.children && node.children.length > 0;

//   const handleClick = () => {
//     onSelect(node);
//   };

//   const handleExpandClick = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setExpanded(!expanded);
//   };

//   return (
//     <div className="flex flex-col items-center my-4">
//       {/* Vertical line from parent (if not root) */}
//       {level > 0 && (
//         <div className="w-px h-8 bg-blue-300/50" />
//       )}

//       {/* Node container */}
//       <div className="relative flex items-center">
//         {/* Left connecting line */}
//         {!isFirst && (
//           <div className="w-16 h-px bg-blue-300/50" />
//         )}

//         {/* Node card */}
//         <div
//           className={cn(
//             "relative p-4 rounded-xl border-2 shadow-lg cursor-pointer transition-all duration-200",
//             "min-w-[200px] bg-white hover:shadow-xl hover:-translate-y-1",
//             isSelected 
//               ? "border-blue-500 shadow-blue-100 bg-blue-50/50" 
//               : "border-white bg-gradient-to-br from-white to-gray-50/50",
//             node.status === 'completed' && "border-green-200 bg-green-50/30"
//           )}
//           onClick={handleClick}
//         >
//           {/* Status indicator */}
//           <div className={cn(
//             "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center",
//             node.status === 'completed' 
//               ? "bg-green-500 text-white" 
//               : "bg-gray-200 text-gray-600"
//           )}>
//             {node.status === 'completed' ? '✓' : '○'}
//           </div>

//           {/* Expand/collapse button for parent nodes */}
//           {hasChildren && (
//             <button
//               onClick={handleExpandClick}
//               className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md hover:bg-blue-600 transition-colors z-10"
//             >
//               {expanded ? '−' : '+'}
//             </button>
//           )}

//           {/* Node content */}
//           <div className="text-center">
//             <div className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
//               {node.type}
//             </div>
//             <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">
//               {node.title}
//             </h4>
            
//             {/* Time estimate */}
//             {node.timeEstimate > 0 && (
//               <div className="text-sm text-gray-600 mb-2">
//                 ⏱️ {Math.floor(node.timeEstimate / 60)}h {node.timeEstimate % 60}m
//               </div>
//             )}

//             {/* Children count */}
//             {hasChildren && (
//               <div className="text-xs text-gray-500">
//                 {node.children.length} subtopics
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Right connecting line */}
//         {!isLast && (
//           <div className="w-16 h-px bg-blue-300/50" />
//         )}
//       </div>

//       {/* Children */}
//       {hasChildren && expanded && (
//         <div className="mt-8 relative">
//           {/* Horizontal connector line */}
//           <div className="absolute left-1/2 top-0 w-px h-8 bg-blue-300/30" />
          
//           {/* Children container */}
//           <div className="flex items-start gap-8 pt-8">
//             {node.children.map((child: any, index: number) => (
//               <TreeNodeComponent
//                 key={child.id}
//                 node={child}
//                 level={level + 1}
//                 isFirst={index === 0}
//                 isLast={index === node.children.length - 1}
//                 onSelect={onSelect}
//                 isSelected={isSelected}
//               />
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // Helper function to build tree structure
// function buildTree(nodes: NodeResponse[]) {
//   const nodeMap = new Map<number, any>();
//   const rootNodes: any[] = [];

//   // Create map
//   nodes.forEach(node => {
//     nodeMap.set(node.id, { ...node, children: [] });
//   });

//   // Build tree
//   nodes.forEach(node => {
//     const treeNode = nodeMap.get(node.id)!;
    
//     if (node.parentId && nodeMap.has(node.parentId)) {
//       const parent = nodeMap.get(node.parentId)!;
//       parent.children.push(treeNode);
//     } else {
//       rootNodes.push(treeNode);
//     }
//   });

//   // Sort by order
//   const sortTree = (nodes: any[]) => {
//     nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
//     nodes.forEach(node => {
//       if (node.children) {
//         sortTree(node.children);
//       }
//     });
//   };

//   sortTree(rootNodes);
//   return rootNodes;
// }


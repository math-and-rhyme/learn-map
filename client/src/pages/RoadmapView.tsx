import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useRoadmap } from "@/hooks/use-roadmaps";
import { useNodes } from "@/hooks/use-nodes";
import { NodeTree } from "@/components/NodeTree";
import { NodeDetail } from "@/components/NodeDetail";
import { CSVUploadDialog } from "@/components/CSVUploadDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  PieChart, 
  Clock, 
  CheckCircle,
  Layout,
  Calendar,
  Target,
  Upload,
  ListTree,
  Eye 
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
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
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

  // Calculate time-based metrics
  const completedMinutes = nodes
    ?.filter(n => n.status === 'completed')
    .reduce((acc, curr) => acc + (curr.timeEstimate || 0), 0) || 0;
  const completedHours = Math.floor(completedMinutes / 60);
  const completedMinutesRemainder = completedMinutes % 60;
  
  const timeProgress = totalMinutes === 0 ? 0 : Math.round((completedMinutes / totalMinutes) * 100);

  const remainingMinutes = totalMinutes - completedMinutes;
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingMinutesRemainder = remainingMinutes % 60;

  // Calculate days remaining based on dailyFocusTime
  const dailyFocusTime = roadmap.dailyFocusTime || 60; // Default to 60 minutes per day
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

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Fixed height */}
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
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {totalHours}h {totalMinutesRemainder}m total</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {completedNodes}/{totalNodes} done</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/roadmap/${roadmapId}/tree`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ListTree className="h-4 w-4" />
              Tree View
            </Button>
          </Link>

          <Link href={`/roadmap/${roadmapId}/flow`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              Flow View
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCsvDialogOpen(true)} className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                Delete Roadmap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>


      {/* Compact Progress Metrics Section */}
      <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50/30 px-6 py-3 shrink-0">
        <div className="max-w-6xl mx-auto">
          {/* Single row with consistent layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Item Completion - Blue theme */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 shadow-sm">
              {/* Card header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Items</span>
                </div>
                <div className="text-xl font-bold text-blue-600">{progress}%</div>
              </div>
              
              {/* Completion text */}
              <div className="text-xs text-gray-500 mb-2">
                {completedNodes} of {totalNodes} completed • {totalNodes - completedNodes} left
              </div>
              
              {/* Progress bar */}
              <Progress 
                value={progress} 
                className="h-2 bg-blue-100" 
              />
            </div>
            
            {/* Time Completion - Green theme */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 shadow-sm">
              {/* Card header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Time</span>
                </div>
                <div className="text-xl font-bold text-green-600">{timeProgress}%</div>
              </div>
              
              {/* Completion text */}
              <div className="text-xs text-gray-500 mb-2">
                {completedHours}h {completedMinutesRemainder}m of {totalHours}h {totalMinutesRemainder}m • {remainingHours}h left
              </div>
              
              {/* Progress bar */}
              <Progress 
                value={timeProgress} 
                className="h-2 bg-green-100" 
              />
            </div>
            
            {/* Days Remaining - Yellow/Amber theme (NO PROGRESS BAR) */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 shadow-sm">
              {/* Card header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-gray-700">Days Left</span>
                </div>
                <div className="text-xl font-bold text-amber-600">{daysRemaining}</div>
              </div>
              
              {/* Details text */}
              <div className="text-xs text-gray-500">
                {remainingHours}h {remainingMinutesRemainder}m total • {dailyFocusTime}m daily
              </div>
            </div>
            
            {/* Est. Completion - Violet/Purple theme (NO PROGRESS BAR) */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 shadow-sm">
              {/* Card header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-600" />
                  <span className="text-sm font-medium text-gray-700">Est. Finish</span>
                </div>
                <div className="text-xl font-bold text-violet-600">
                  {projectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              
              {/* Details text */}
              <div className="text-xs text-gray-500">
                {daysRemaining} days from now • {dailyFocusTime}m per day
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA - Takes remaining screen space */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Tree View */}
        <div className="w-full md:w-1/3 lg:w-1/4 border-r bg-muted/10 flex flex-col min-w-[300px] overflow-hidden">
          <div className="p-4 border-b bg-muted/20 shrink-0">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Curriculum</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              {nodes && (
                <NodeTree 
                  nodes={nodes} 
                  roadmapId={roadmapId} 
                  onSelectNode={setSelectedNode}
                  selectedNodeId={selectedNode?.id}
                />
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel: Content / Details - Takes remaining width */}
        <div className="flex-1 bg-background flex flex-col overflow-hidden">
          {selectedNode ? (
            <ScrollArea className="flex-1">
              <div className="p-6 max-w-4xl mx-auto w-full">
                <NodeDetail key={selectedNode.id} node={selectedNode} />
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <div className="bg-muted/30 p-6 rounded-full mb-6">
                <Layout className="h-12 w-12 opacity-50" />
              </div>
              <h3 className="text-xl font-medium mb-2 text-foreground">Select an item to view details</h3>
              <p className="max-w-md">
                Click on any item in the curriculum list on the left to edit its details, add notes, or mark it as complete.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CSV Upload Dialog */}
      {roadmap && (
        <CSVUploadDialog 
          roadmapId={roadmapId} 
          open={csvDialogOpen} 
          onOpenChange={setCsvDialogOpen} 
        />
      )}
    </div>
  );
}

// import { useState } from "react";
// import { useRoute, Link } from "wouter";
// import { useRoadmap } from "@/hooks/use-roadmaps";
// import { useNodes } from "@/hooks/use-nodes";
// import { NodeTree } from "@/components/NodeTree";
// import { NodeDetail } from "@/components/NodeDetail";
// import { CSVUploadDialog } from "@/components/CSVUploadDialog";
// import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { 
//   ArrowLeft, 
//   MoreHorizontal, 
//   PieChart, 
//   Clock, 
//   CheckCircle,
//   Layout,
//   Calendar,
//   Target,
//   Upload,
//   ListTree,
//   Eye 
// } from "lucide-react";
// import { type NodeResponse } from "@shared/schema";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
//   DropdownMenuSeparator
// } from "@/components/ui/dropdown-menu";
// import { useDeleteRoadmap } from "@/hooks/use-roadmaps";
// import { useToast } from "@/hooks/use-toast";
// import { 
//   Sheet, 
//   SheetContent, 
//   SheetTrigger 
// } from "@/components/ui/sheet";

// export default function RoadmapView() {
//   const [, params] = useRoute("/roadmap/:id");
//   const roadmapId = Number(params?.id);
  
//   const { data: roadmap, isLoading: loadingRoadmap } = useRoadmap(roadmapId);
//   const { data: nodes, isLoading: loadingNodes } = useNodes(roadmapId);
  
//   const [selectedNode, setSelectedNode] = useState<NodeResponse | null>(null);
//   const [csvDialogOpen, setCsvDialogOpen] = useState(false);
//   const { mutate: deleteRoadmap } = useDeleteRoadmap();
//   const { toast } = useToast();

//   if (loadingRoadmap || loadingNodes) {
//     return (
//       <div className="h-screen w-full flex items-center justify-center bg-background">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   if (!roadmap) {
//     return (
//       <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
//         <h1 className="text-2xl font-bold">Roadmap Not Found</h1>
//         <Link href="/">
//           <Button>Return Home</Button>
//         </Link>
//       </div>
//     );
//   }

//   // Calculate Metrics
//   const totalNodes = nodes?.length || 0;
//   const completedNodes = nodes?.filter(n => n.status === 'completed').length || 0;
//   const progress = totalNodes === 0 ? 0 : Math.round((completedNodes / totalNodes) * 100);
  
//   const totalMinutes = nodes?.reduce((acc, curr) => acc + (curr.timeEstimate || 0), 0) || 0;
//   const totalHours = Math.floor(totalMinutes / 60);
//   const totalMinutesRemainder = totalMinutes % 60;

//   // Calculate time-based metrics
//   const completedMinutes = nodes
//     ?.filter(n => n.status === 'completed')
//     .reduce((acc, curr) => acc + (curr.timeEstimate || 0), 0) || 0;
//   const completedHours = Math.floor(completedMinutes / 60);
//   const completedMinutesRemainder = completedMinutes % 60;
  
//   const timeProgress = totalMinutes === 0 ? 0 : Math.round((completedMinutes / totalMinutes) * 100);

//   const remainingMinutes = totalMinutes - completedMinutes;
//   const remainingHours = Math.floor(remainingMinutes / 60);
//   const remainingMinutesRemainder = remainingMinutes % 60;

//   // Calculate days remaining based on dailyFocusTime
//   const dailyFocusTime = roadmap.dailyFocusTime || 60; // Default to 60 minutes per day
//   const daysRemaining = dailyFocusTime > 0 
//     ? Math.ceil(remainingMinutes / dailyFocusTime) 
//     : 0;
  
//   const projectedDate = new Date();
//   projectedDate.setDate(projectedDate.getDate() + daysRemaining);

//   const handleDelete = () => {
//     if (confirm("Are you sure? This action cannot be undone.")) {
//       deleteRoadmap(roadmapId, {
//         onSuccess: () => window.location.href = "/"
//       });
//     }
//   };

//   return (
//     <div className="h-screen flex flex-col bg-background overflow-hidden">
//       {/* Header - Fixed height */}
//       <header className="h-16 border-b flex items-center justify-between px-6 bg-background shrink-0 z-10">
//         <div className="flex items-center gap-4">
//           <Link href="/">
//             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
//               <ArrowLeft className="h-5 w-5" />
//             </Button>
//           </Link>
//           <div className="flex flex-col">
//             <h1 className="font-display font-bold text-lg leading-tight">{roadmap.title}</h1>
//             <div className="flex items-center gap-3 text-xs text-muted-foreground">
//               <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {totalHours}h {totalMinutesRemainder}m total</span>
//               <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {completedNodes}/{totalNodes} done</span>
//             </div>
//           </div>
//         </div>

//         <Link href={`/roadmap/${roadmapId}/tree`}>
//           <Button variant="outline" size="sm" className="gap-2">
//             <ListTree className="h-4 w-4" />
//             Tree View
//           </Button>
//         </Link>

//         <Link href={`/roadmap/${roadmapId}/flow`}>
//           <Button variant="outline" size="sm" className="gap-2">
//             <ListTree className="h-4 w-4" />
//             Flow View
//           </Button>
//         </Link>

//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost" size="icon">
//               <MoreHorizontal className="h-5 w-5" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuItem onClick={() => setCsvDialogOpen(true)} className="cursor-pointer">
//               <Upload className="h-4 w-4 mr-2" />
//               Import CSV
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
//               Delete Roadmap
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </header>


//       {/* Progress Metrics - Auto height, won't shrink */}
//       <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50/30 px-6 py-4 shrink-0">
//         <div className="max-w-6xl mx-auto">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//             {/* Item Completion */}
//             <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
//               <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
//                 <PieChart className="h-4 w-4" />
//                 <span>Item Completion</span>
//               </div>
//               <div className="text-2xl font-bold">{progress}%</div>
//               <div className="text-xs text-muted-foreground mt-1">
//                 {completedNodes} of {totalNodes} items
//               </div>
//             </div>
            
//             {/* Time Completion */}
//             <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
//               <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
//                 <Clock className="h-4 w-4" />
//                 <span>Time Completion</span>
//               </div>
//               <div className="text-2xl font-bold">{timeProgress}%</div>
//               <div className="text-xs text-muted-foreground mt-1">
//                 {completedHours}h {completedMinutesRemainder}m out of {totalHours}h {totalMinutesRemainder}m
//               </div>
//             </div>
            
//             {/* Days Remaining */}
//             <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
//               <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
//                 <Target className="h-4 w-4" />
//                 <span>Days Remaining</span>
//               </div>
//               <div className="text-2xl font-bold">{daysRemaining}</div>
//               <div className="text-xs text-muted-foreground mt-1">
//                 {remainingHours}h {remainingMinutesRemainder}m left
//               </div>
//             </div>
            
//             {/* Est. Completion */}
//             <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
//               <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
//                 <Calendar className="h-4 w-4" />
//                 <span>Est. Completion</span>
//               </div>
//               <div className="text-2xl font-bold">
//                 {projectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
//               </div>
//               <div className="text-xs text-muted-foreground mt-1">
//                 {dailyFocusTime}m per day
//               </div>
//             </div>
//           </div>
          
//           {/* Dual Progress Bars - SIDE BY SIDE */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Item Progress Bar */}
//             <div className="bg-white/80 backdrop-blur-sm rounded-lg border p-4">
//               <div className="flex justify-between items-center mb-3">
//                 <div className="flex items-center gap-2">
//                   <PieChart className="h-5 w-5 text-blue-600" />
//                   <span className="text-sm font-medium text-gray-700">Item Progress</span>
//                 </div>
//                 <span className="text-xl font-bold text-blue-600">{progress}%</span>
//               </div>
//               <Progress 
//                 value={progress} 
//                 className="h-4 bg-gray-200/80" 
//               />
//               <div className="flex justify-between text-xs text-gray-500 mt-2">
//                 <span>{completedNodes} of {totalNodes} items completed</span>
//                 <span>{totalNodes - completedNodes} items remaining</span>
//               </div>
//             </div>

//             {/* Time Progress Bar */}
//             <div className="bg-white/80 backdrop-blur-sm rounded-lg border p-4">
//               <div className="flex justify-between items-center mb-3">
//                 <div className="flex items-center gap-2">
//                   <Clock className="h-5 w-5 text-green-600" />
//                   <span className="text-sm font-medium text-gray-700">Time Progress</span>
//                 </div>
//                 <span className="text-xl font-bold text-green-600">{timeProgress}%</span>
//               </div>
//               <Progress 
//                 value={timeProgress} 
//                 className="h-4 bg-gray-200/80" 
//               />
//               <div className="flex justify-between text-xs text-gray-500 mt-2">
//                 <span>{completedHours}h {completedMinutesRemainder}m completed</span>
//                 <span>{remainingHours}h {remainingMinutesRemainder}m remaining</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* MAIN CONTENT AREA - Takes remaining screen space */}
//       <div className="flex-1 flex overflow-hidden">
        
//         {/* Left Panel: Tree View */}
//         <div className="w-full md:w-1/3 lg:w-1/4 border-r bg-muted/10 flex flex-col min-w-[300px] overflow-hidden">
//           <div className="p-4 border-b bg-muted/20 shrink-0">
//             <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Curriculum</h2>
//           </div>
//           <ScrollArea className="flex-1">
//             <div className="p-4">
//               {nodes && (
//                 <NodeTree 
//                   nodes={nodes} 
//                   roadmapId={roadmapId} 
//                   onSelectNode={setSelectedNode}
//                   selectedNodeId={selectedNode?.id}
//                 />
//               )}
//             </div>
//           </ScrollArea>
//         </div>

//         {/* Right Panel: Content / Details - Takes remaining width */}
//         <div className="flex-1 bg-background flex flex-col overflow-hidden">
//           {selectedNode ? (
//             <ScrollArea className="flex-1">
//               <div className="p-6 max-w-4xl mx-auto w-full">
//                 <NodeDetail key={selectedNode.id} node={selectedNode} />
//               </div>
//             </ScrollArea>
//           ) : (
//             <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
//               <div className="bg-muted/30 p-6 rounded-full mb-6">
//                 <Layout className="h-12 w-12 opacity-50" />
//               </div>
//               <h3 className="text-xl font-medium mb-2 text-foreground">Select an item to view details</h3>
//               <p className="max-w-md">
//                 Click on any item in the curriculum list on the left to edit its details, add notes, or mark it as complete.
//               </p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* CSV Upload Dialog */}
//       {roadmap && (
//         <CSVUploadDialog 
//           roadmapId={roadmapId} 
//           open={csvDialogOpen} 
//           onOpenChange={setCsvDialogOpen} 
//         />
//       )}
//     </div>
//   );
// }

// // import { useState } from "react";
// // import { useRoute, Link } from "wouter";
// // import { useRoadmap } from "@/hooks/use-roadmaps";
// // import { useNodes } from "@/hooks/use-nodes";
// // import { NodeTree } from "@/components/NodeTree";
// // import { NodeDetail } from "@/components/NodeDetail";
// // import { Button } from "@/components/ui/button";
// // import { Progress } from "@/components/ui/progress";
// // import { ScrollArea } from "@/components/ui/scroll-area";
// // import { 
// //   ArrowLeft, 
// //   MoreHorizontal, 
// //   PieChart, 
// //   Clock, 
// //   CheckCircle,
// //   Layout,
// //   Calendar,
// //   Target
// // } from "lucide-react";
// // import { type NodeResponse } from "@shared/schema";
// // import {
// //   DropdownMenu,
// //   DropdownMenuContent,
// //   DropdownMenuItem,
// //   DropdownMenuTrigger,
// // } from "@/components/ui/dropdown-menu";
// // import { useDeleteRoadmap } from "@/hooks/use-roadmaps";
// // import { useToast } from "@/hooks/use-toast";
// // import { 
// //   Sheet, 
// //   SheetContent, 
// //   SheetTrigger 
// // } from "@/components/ui/sheet";

// // export default function RoadmapView() {
// //   const [, params] = useRoute("/roadmap/:id");
// //   const roadmapId = Number(params?.id);
  
// //   const { data: roadmap, isLoading: loadingRoadmap } = useRoadmap(roadmapId);
// //   const { data: nodes, isLoading: loadingNodes } = useNodes(roadmapId);
  
// //   const [selectedNode, setSelectedNode] = useState<NodeResponse | null>(null);
// //   const { mutate: deleteRoadmap } = useDeleteRoadmap();
// //   const { toast } = useToast();

// //   if (loadingRoadmap || loadingNodes) {
// //     return (
// //       <div className="h-screen w-full flex items-center justify-center bg-background">
// //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
// //       </div>
// //     );
// //   }

// //   if (!roadmap) {
// //     return (
// //       <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
// //         <h1 className="text-2xl font-bold">Roadmap Not Found</h1>
// //         <Link href="/">
// //           <Button>Return Home</Button>
// //         </Link>
// //       </div>
// //     );
// //   }

// //   // Calculate Metrics
// //   const totalNodes = nodes?.length || 0;
// //   const completedNodes = nodes?.filter(n => n.status === 'completed').length || 0;
// //   const progress = totalNodes === 0 ? 0 : Math.round((completedNodes / totalNodes) * 100);
  
// //   const totalMinutes = nodes?.reduce((acc, curr) => acc + (curr.timeEstimate || 0), 0) || 0;
// //   const totalHours = Math.floor(totalMinutes / 60);
// //   const totalMinutesRemainder = totalMinutes % 60;

// //   // Calculate time-based metrics
// //   const completedMinutes = nodes
// //     ?.filter(n => n.status === 'completed')
// //     .reduce((acc, curr) => acc + (curr.timeEstimate || 0), 0) || 0;
// //   const completedHours = Math.floor(completedMinutes / 60);
// //   const completedMinutesRemainder = completedMinutes % 60;
  
// //   const timeProgress = totalMinutes === 0 ? 0 : Math.round((completedMinutes / totalMinutes) * 100);

// //   const remainingMinutes = totalMinutes - completedMinutes;
// //   const remainingHours = Math.floor(remainingMinutes / 60);
// //   const remainingMinutesRemainder = remainingMinutes % 60;

// //   // Calculate days remaining based on dailyFocusTime
// //   const dailyFocusTime = roadmap.dailyFocusTime || 60; // Default to 60 minutes per day
// //   const daysRemaining = dailyFocusTime > 0 
// //     ? Math.ceil(remainingMinutes / dailyFocusTime) 
// //     : 0;
  
// //   const projectedDate = new Date();
// //   projectedDate.setDate(projectedDate.getDate() + daysRemaining);

// //   const handleDelete = () => {
// //     if (confirm("Are you sure? This action cannot be undone.")) {
// //       deleteRoadmap(roadmapId, {
// //         onSuccess: () => window.location.href = "/"
// //       });
// //     }
// //   };

// //   return (
// //     <div className="h-screen flex flex-col bg-background overflow-hidden">
// //       {/* Header - Fixed height */}
// //       <header className="h-16 border-b flex items-center justify-between px-6 bg-background shrink-0 z-10">
// //         <div className="flex items-center gap-4">
// //           <Link href="/">
// //             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
// //               <ArrowLeft className="h-5 w-5" />
// //             </Button>
// //           </Link>
// //           <div className="flex flex-col">
// //             <h1 className="font-display font-bold text-lg leading-tight">{roadmap.title}</h1>
// //             <div className="flex items-center gap-3 text-xs text-muted-foreground">
// //               <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {totalHours}h {totalMinutesRemainder}m total</span>
// //               <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {completedNodes}/{totalNodes} done</span>
// //             </div>
// //           </div>
// //         </div>

// //         <DropdownMenu>
// //           <DropdownMenuTrigger asChild>
// //             <Button variant="ghost" size="icon">
// //               <MoreHorizontal className="h-5 w-5" />
// //             </Button>
// //           </DropdownMenuTrigger>
// //           <DropdownMenuContent align="end">
// //             <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
// //               Delete Roadmap
// //             </DropdownMenuItem>
// //           </DropdownMenuContent>
// //         </DropdownMenu>
// //       </header>

// //       {/* Progress Metrics - Auto height, won't shrink */}
// //       <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50/30 px-6 py-4 shrink-0">
// //         <div className="max-w-6xl mx-auto">
// //           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
// //             {/* Item Completion */}
// //             <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
// //               <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
// //                 <PieChart className="h-4 w-4" />
// //                 <span>Item Completion</span>
// //               </div>
// //               <div className="text-2xl font-bold">{progress}%</div>
// //               <div className="text-xs text-muted-foreground mt-1">
// //                 {completedNodes} of {totalNodes} items
// //               </div>
// //             </div>
            
// //             {/* Time Completion */}
// //             <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
// //               <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
// //                 <Clock className="h-4 w-4" />
// //                 <span>Time Completion</span>
// //               </div>
// //               <div className="text-2xl font-bold">{timeProgress}%</div>
// //               <div className="text-xs text-muted-foreground mt-1">
// //                 {completedHours}h {completedMinutesRemainder}m out of {totalHours}h {totalMinutesRemainder}m
// //               </div>
// //             </div>
            
// //             {/* Days Remaining */}
// //             <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
// //               <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
// //                 <Target className="h-4 w-4" />
// //                 <span>Days Remaining</span>
// //               </div>
// //               <div className="text-2xl font-bold">{daysRemaining}</div>
// //               <div className="text-xs text-muted-foreground mt-1">
// //                 {remainingHours}h {remainingMinutesRemainder}m left
// //               </div>
// //             </div>
            
// //             {/* Est. Completion */}
// //             <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
// //               <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
// //                 <Calendar className="h-4 w-4" />
// //                 <span>Est. Completion</span>
// //               </div>
// //               <div className="text-2xl font-bold">
// //                 {projectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
// //               </div>
// //               <div className="text-xs text-muted-foreground mt-1">
// //                 {dailyFocusTime}m per day
// //               </div>
// //             </div>
// //           </div>
          
// //           {/* Dual Progress Bars - SIDE BY SIDE */}
// //           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
// //             {/* Item Progress Bar */}
// //             <div className="bg-white/80 backdrop-blur-sm rounded-lg border p-4">
// //               <div className="flex justify-between items-center mb-3">
// //                 <div className="flex items-center gap-2">
// //                   <PieChart className="h-5 w-5 text-blue-600" />
// //                   <span className="text-sm font-medium text-gray-700">Item Progress</span>
// //                 </div>
// //                 <span className="text-xl font-bold text-blue-600">{progress}%</span>
// //               </div>
// //               <Progress 
// //                 value={progress} 
// //                 className="h-4 bg-gray-200/80" 
// //               />
// //               <div className="flex justify-between text-xs text-gray-500 mt-2">
// //                 <span>{completedNodes} of {totalNodes} items completed</span>
// //                 <span>{totalNodes - completedNodes} items remaining</span>
// //               </div>
// //             </div>

// //             {/* Time Progress Bar */}
// //             <div className="bg-white/80 backdrop-blur-sm rounded-lg border p-4">
// //               <div className="flex justify-between items-center mb-3">
// //                 <div className="flex items-center gap-2">
// //                   <Clock className="h-5 w-5 text-green-600" />
// //                   <span className="text-sm font-medium text-gray-700">Time Progress</span>
// //                 </div>
// //                 <span className="text-xl font-bold text-green-600">{timeProgress}%</span>
// //               </div>
// //               <Progress 
// //                 value={timeProgress} 
// //                 className="h-4 bg-gray-200/80" 
// //               />
// //               <div className="flex justify-between text-xs text-gray-500 mt-2">
// //                 <span>{completedHours}h {completedMinutesRemainder}m completed</span>
// //                 <span>{remainingHours}h {remainingMinutesRemainder}m remaining</span>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* MAIN CONTENT AREA - Takes remaining screen space */}
// //       <div className="flex-1 flex overflow-hidden">
        
// //         {/* Left Panel: Tree View */}
// //         <div className="w-full md:w-1/3 lg:w-1/4 border-r bg-muted/10 flex flex-col min-w-[300px] overflow-hidden">
// //           <div className="p-4 border-b bg-muted/20 shrink-0">
// //             <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Curriculum</h2>
// //           </div>
// //           <ScrollArea className="flex-1">
// //             <div className="p-4">
// //               {nodes && (
// //                 <NodeTree 
// //                   nodes={nodes} 
// //                   roadmapId={roadmapId} 
// //                   onSelectNode={setSelectedNode}
// //                   selectedNodeId={selectedNode?.id}
// //                 />
// //               )}
// //             </div>
// //           </ScrollArea>
// //         </div>

// //         {/* Right Panel: Content / Details - Takes remaining width */}
// //         <div className="flex-1 bg-background flex flex-col overflow-hidden">
// //           {selectedNode ? (
// //             <ScrollArea className="flex-1">
// //               <div className="p-6 max-w-4xl mx-auto w-full">
// //                 <NodeDetail key={selectedNode.id} node={selectedNode} />
// //               </div>
// //             </ScrollArea>
// //           ) : (
// //             <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
// //               <div className="bg-muted/30 p-6 rounded-full mb-6">
// //                 <Layout className="h-12 w-12 opacity-50" />
// //               </div>
// //               <h3 className="text-xl font-medium mb-2 text-foreground">Select an item to view details</h3>
// //               <p className="max-w-md">
// //                 Click on any item in the curriculum list on the left to edit its details, add notes, or mark it as complete.
// //               </p>
// //             </div>
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // import { useState } from "react";
// // // import { useRoute, Link } from "wouter";
// // // import { useRoadmap } from "@/hooks/use-roadmaps";
// // // import { useNodes } from "@/hooks/use-nodes";
// // // import { NodeTree } from "@/components/NodeTree";
// // // import { NodeDetail } from "@/components/NodeDetail";
// // // import { Button } from "@/components/ui/button";
// // // import { Progress } from "@/components/ui/progress";
// // // import { ScrollArea } from "@/components/ui/scroll-area";
// // // import { 
// // //   ArrowLeft, 
// // //   MoreHorizontal, 
// // //   PieChart, 
// // //   Clock, 
// // //   CheckCircle,
// // //   Layout,
// // //   Calendar,
// // //   Target
// // // } from "lucide-react";
// // // import { type NodeResponse } from "@shared/schema";
// // // import {
// // //   DropdownMenu,
// // //   DropdownMenuContent,
// // //   DropdownMenuItem,
// // //   DropdownMenuTrigger,
// // // } from "@/components/ui/dropdown-menu";
// // // import { useDeleteRoadmap } from "@/hooks/use-roadmaps";
// // // import { useToast } from "@/hooks/use-toast";
// // // import { 
// // //   Sheet, 
// // //   SheetContent, 
// // //   SheetTrigger 
// // // } from "@/components/ui/sheet";

// // // export default function RoadmapView() {
// // //   const [, params] = useRoute("/roadmap/:id");
// // //   const roadmapId = Number(params?.id);

// // //   const { data: roadmap, isLoading: loadingRoadmap } = useRoadmap(roadmapId);
// // //   const { data: nodes, isLoading: loadingNodes } = useNodes(roadmapId);

// // //   const [selectedNode, setSelectedNode] = useState<NodeResponse | null>(null);
// // //   const { mutate: deleteRoadmap } = useDeleteRoadmap();
// // //   const { toast } = useToast();

// // //   if (loadingRoadmap || loadingNodes) {
// // //     return (
// // //       <div className="h-screen w-full flex items-center justify-center bg-background">
// // //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
// // //       </div>
// // //     );
// // //   }

// // //   if (!roadmap) {
// // //     return (
// // //       <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
// // //         <h1 className="text-2xl font-bold">Roadmap Not Found</h1>
// // //         <Link href="/">
// // //           <Button>Return Home</Button>
// // //         </Link>
// // //       </div>
// // //     );
// // //   }

// // //   // Calculate Metrics
// // //   const totalNodes = nodes?.length || 0;
// // //   const completedNodes = nodes?.filter(n => n.status === 'completed').length || 0;
// // //   const progress = totalNodes === 0 ? 0 : Math.round((completedNodes / totalNodes) * 100);

// // //   const totalMinutes = nodes?.reduce((acc, curr) => acc + (curr.timeEstimate || 0), 0) || 0;
// // //   const totalHours = Math.floor(totalMinutes / 60);
// // //   const totalMinutesRemainder = totalMinutes % 60;

// // //   // Calculate time-based metrics
// // //   const completedMinutes = nodes
// // //     ?.filter(n => n.status === 'completed')
// // //     .reduce((acc, curr) => acc + (curr.timeEstimate || 0), 0) || 0;
// // //   const completedHours = Math.floor(completedMinutes / 60);
// // //   const completedMinutesRemainder = completedMinutes % 60;

// // //   const timeProgress = totalMinutes === 0 ? 0 : Math.round((completedMinutes / totalMinutes) * 100);

// // //   const remainingMinutes = totalMinutes - completedMinutes;
// // //   const remainingHours = Math.floor(remainingMinutes / 60);
// // //   const remainingMinutesRemainder = remainingMinutes % 60;

// // //   // Calculate days remaining based on dailyFocusTime
// // //   const dailyFocusTime = roadmap.dailyFocusTime || 60; // Default to 60 minutes per day
// // //   const daysRemaining = dailyFocusTime > 0 
// // //     ? Math.ceil(remainingMinutes / dailyFocusTime) 
// // //     : 0;

// // //   const projectedDate = new Date();
// // //   projectedDate.setDate(projectedDate.getDate() + daysRemaining);

// // //   const handleDelete = () => {
// // //     if (confirm("Are you sure? This action cannot be undone.")) {
// // //       deleteRoadmap(roadmapId, {
// // //         onSuccess: () => window.location.href = "/"
// // //       });
// // //     }
// // //   };

// // //   return (
// // //     <div className="h-screen flex flex-col bg-background overflow-hidden">
// // //       {/* Header - Simplified without progress metrics */}
// // //       <header className="h-16 border-b flex items-center justify-between px-6 bg-background shrink-0 z-10">
// // //         <div className="flex items-center gap-4">
// // //           <Link href="/">
// // //             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
// // //               <ArrowLeft className="h-5 w-5" />
// // //             </Button>
// // //           </Link>
// // //           <div className="flex flex-col">
// // //             <h1 className="font-display font-bold text-lg leading-tight">{roadmap.title}</h1>
// // //             <div className="flex items-center gap-3 text-xs text-muted-foreground">
// // //               <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {totalHours}h {totalMinutesRemainder}m total</span>
// // //               <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {completedNodes}/{totalNodes} done</span>
// // //             </div>
// // //           </div>
// // //         </div>

// // //         <DropdownMenu>
// // //           <DropdownMenuTrigger asChild>
// // //             <Button variant="ghost" size="icon">
// // //               <MoreHorizontal className="h-5 w-5" />
// // //             </Button>
// // //           </DropdownMenuTrigger>
// // //           <DropdownMenuContent align="end">
// // //             <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
// // //               Delete Roadmap
// // //             </DropdownMenuItem>
// // //           </DropdownMenuContent>
// // //         </DropdownMenu>
// // //       </header>

// // //       {/* BIG Progress Metrics Section */}
// // //       <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50/30 px-6 py-4">
// // //         <div className="max-w-6xl mx-auto">
// // //           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
// // //             {/* Item Completion */}
// // //             <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
// // //               <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
// // //                 <PieChart className="h-4 w-4" />
// // //                 <span>Item Completion</span>
// // //               </div>
// // //               <div className="text-2xl font-bold">{progress}%</div>
// // //               <div className="text-xs text-muted-foreground mt-1">
// // //                 {completedNodes} of {totalNodes} items
// // //               </div>
// // //             </div>

// // //             {/* Time Completion */}
// // //             <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
// // //               <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
// // //                 <Clock className="h-4 w-4" />
// // //                 <span>Time Completion</span>
// // //               </div>
// // //               <div className="text-2xl font-bold">{timeProgress}%</div>
// // //               <div className="text-xs text-muted-foreground mt-1">
// // //                 {completedHours}h {completedMinutesRemainder}m out of {totalHours}h {totalMinutesRemainder}m
// // //               </div>
// // //             </div>

// // //             {/* Days Remaining */}
// // //             <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
// // //               <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
// // //                 <Target className="h-4 w-4" />
// // //                 <span>Days Remaining</span>
// // //               </div>
// // //               <div className="text-2xl font-bold">{daysRemaining}</div>
// // //               <div className="text-xs text-muted-foreground mt-1">
// // //                 {remainingHours}h {remainingMinutesRemainder}m left
// // //               </div>
// // //             </div>

// // //             {/* Est. Completion */}
// // //             <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
// // //               <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
// // //                 <Calendar className="h-4 w-4" />
// // //                 <span>Est. Completion</span>
// // //               </div>
// // //               <div className="text-2xl font-bold">
// // //                 {projectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
// // //               </div>
// // //               <div className="text-xs text-muted-foreground mt-1">
// // //                 {dailyFocusTime}m per day
// // //               </div>
// // //             </div>
// // //           </div>

// // //           {/* Dual Progress Bars - SIDE BY SIDE */}
// // //           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
// // //             {/* Item Progress Bar */}
// // //             <div className="bg-white/80 backdrop-blur-sm rounded-lg border p-4">
// // //               <div className="flex justify-between items-center mb-3">
// // //                 <div className="flex items-center gap-2">
// // //                   <PieChart className="h-5 w-5 text-blue-600" />
// // //                   <span className="text-sm font-medium text-gray-700">Item Progress</span>
// // //                 </div>
// // //                 <span className="text-xl font-bold text-blue-600">{progress}%</span>
// // //               </div>
// // //               <Progress 
// // //                 value={progress} 
// // //                 className="h-4 bg-gray-200/80" 
// // //               />
// // //               <div className="flex justify-between text-xs text-gray-500 mt-2">
// // //                 <span>{completedNodes} of {totalNodes} items completed</span>
// // //                 <span>{totalNodes - completedNodes} items remaining</span>
// // //               </div>
// // //             </div>

// // //             {/* Time Progress Bar */}
// // //             <div className="bg-white/80 backdrop-blur-sm rounded-lg border p-4">
// // //               <div className="flex justify-between items-center mb-3">
// // //                 <div className="flex items-center gap-2">
// // //                   <Clock className="h-5 w-5 text-green-600" />
// // //                   <span className="text-sm font-medium text-gray-700">Time Progress</span>
// // //                 </div>
// // //                 <span className="text-xl font-bold text-green-600">{timeProgress}%</span>
// // //               </div>
// // //               <Progress 
// // //                 value={timeProgress} 
// // //                 className="h-4 bg-gray-200/80" 
// // //               />
// // //               <div className="flex justify-between text-xs text-gray-500 mt-2">
// // //                 <span>{completedHours}h {completedMinutesRemainder}m completed</span>
// // //                 <span>{remainingHours}h {remainingMinutesRemainder}m remaining</span>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </div>

// // //       {/* Main Layout */}
// // //       <div className="flex-1 flex overflow-hidden">

// // //         {/* Left Panel: Tree View */}
// // //         <div className="w-full md:w-1/3 lg:w-1/4 border-r bg-muted/10 flex flex-col min-w-[300px]">
// // //           <div className="p-4 border-b bg-muted/20">
// // //             <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Curriculum</h2>
// // //           </div>
// // //           <ScrollArea className="flex-1 p-4">
// // //             {nodes && (
// // //               <NodeTree 
// // //                 nodes={nodes} 
// // //                 roadmapId={roadmapId} 
// // //                 onSelectNode={setSelectedNode}
// // //                 selectedNodeId={selectedNode?.id}
// // //               />
// // //             )}
// // //           </ScrollArea>
// // //         </div>

// // //         {/* Right Panel: Content / Details */}
// // //         <div className="flex-1 bg-background flex flex-col relative">
// // //           {selectedNode ? (
// // //             <div className="h-full overflow-y-auto custom-scrollbar p-6 max-w-3xl mx-auto w-full">
// // //               <NodeDetail key={selectedNode.id} node={selectedNode} />
// // //             </div>
// // //           ) : (
// // //             <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
// // //               <div className="bg-muted/30 p-6 rounded-full mb-6">
// // //                 <Layout className="h-12 w-12 opacity-50" />
// // //               </div>
// // //               <h3 className="text-xl font-medium mb-2 text-foreground">Select an item to view details</h3>
// // //               <p className="max-w-md">
// // //                 Click on any item in the curriculum list on the left to edit its details, add notes, or mark it as complete.
// // //               </p>
// // //             </div>
// // //           )}
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }
// // // // import { useState } from "react";
// // // // import { useRoute, Link } from "wouter";
// // // // import { useRoadmap } from "@/hooks/use-roadmaps";
// // // // import { useNodes } from "@/hooks/use-nodes";
// // // // import { NodeTree } from "@/components/NodeTree";
// // // // import { NodeDetail } from "@/components/NodeDetail";
// // // // import { Button } from "@/components/ui/button";
// // // // import { ScrollArea } from "@/components/ui/scroll-area";
// // // // import { 
// // // //   ArrowLeft, 
// // // //   MoreHorizontal, 
// // // //   PieChart, 
// // // //   Clock, 
// // // //   CheckCircle,
// // // //   Layout
// // // // } from "lucide-react";
// // // // import { type NodeResponse } from "@shared/schema";
// // // // import {
// // // //   DropdownMenu,
// // // //   DropdownMenuContent,
// // // //   DropdownMenuItem,
// // // //   DropdownMenuTrigger,
// // // // } from "@/components/ui/dropdown-menu";
// // // // import { useDeleteRoadmap } from "@/hooks/use-roadmaps";
// // // // import { useToast } from "@/hooks/use-toast";
// // // // import { 
// // // //   Sheet, 
// // // //   SheetContent, 
// // // //   SheetTrigger 
// // // // } from "@/components/ui/sheet";

// // // // export default function RoadmapView() {
// // // //   const [, params] = useRoute("/roadmap/:id");
// // // //   const roadmapId = Number(params?.id);
  
// // // //   const { data: roadmap, isLoading: loadingRoadmap } = useRoadmap(roadmapId);
// // // //   const { data: nodes, isLoading: loadingNodes } = useNodes(roadmapId);
  
// // // //   const [selectedNode, setSelectedNode] = useState<NodeResponse | null>(null);
// // // //   const { mutate: deleteRoadmap } = useDeleteRoadmap();
// // // //   const { toast } = useToast();

// // // //   if (loadingRoadmap || loadingNodes) {
// // // //     return (
// // // //       <div className="h-screen w-full flex items-center justify-center bg-background">
// // // //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   if (!roadmap) {
// // // //     return (
// // // //       <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
// // // //         <h1 className="text-2xl font-bold">Roadmap Not Found</h1>
// // // //         <Link href="/">
// // // //           <Button>Return Home</Button>
// // // //         </Link>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   // Calculate Metrics
// // // //   const totalNodes = nodes?.length || 0;
// // // //   const completedNodes = nodes?.filter(n => n.status === 'completed').length || 0;
// // // //   const progress = totalNodes === 0 ? 0 : Math.round((completedNodes / totalNodes) * 100);
// // // //   const totalMinutes = nodes?.reduce((acc, curr) => acc + (curr.timeEstimate || 0), 0) || 0;
// // // //   const hours = Math.floor(totalMinutes / 60);

// // // //   const handleDelete = () => {
// // // //     if (confirm("Are you sure? This action cannot be undone.")) {
// // // //       deleteRoadmap(roadmapId, {
// // // //         onSuccess: () => window.location.href = "/"
// // // //       });
// // // //     }
// // // //   };

// // // //   return (
// // // //     <div className="h-screen flex flex-col bg-background overflow-hidden">
// // // //       {/* Header */}
// // // //       <header className="h-16 border-b flex items-center justify-between px-6 bg-background shrink-0 z-10">
// // // //         <div className="flex items-center gap-4">
// // // //           <Link href="/">
// // // //             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
// // // //               <ArrowLeft className="h-5 w-5" />
// // // //             </Button>
// // // //           </Link>
// // // //           <div className="flex flex-col">
// // // //             <h1 className="font-display font-bold text-lg leading-tight">{roadmap.title}</h1>
// // // //             <div className="flex items-center gap-3 text-xs text-muted-foreground">
// // // //               <span className="flex items-center gap-1"><PieChart className="h-3 w-3" /> {progress}% Complete</span>
// // // //               <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {hours}h {totalMinutes % 60}m Est.</span>
// // // //               <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {completedNodes}/{totalNodes} Items</span>
// // // //             </div>
// // // //           </div>
// // // //         </div>

// // // //         <DropdownMenu>
// // // //           <DropdownMenuTrigger asChild>
// // // //             <Button variant="ghost" size="icon">
// // // //               <MoreHorizontal className="h-5 w-5" />
// // // //             </Button>
// // // //           </DropdownMenuTrigger>
// // // //           <DropdownMenuContent align="end">
// // // //             <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
// // // //               Delete Roadmap
// // // //             </DropdownMenuItem>
// // // //           </DropdownMenuContent>
// // // //         </DropdownMenu>
// // // //       </header>

// // // //       {/* Main Layout */}
// // // //       <div className="flex-1 flex overflow-hidden">
        
// // // //         {/* Left Panel: Tree View */}
// // // //         <div className="w-full md:w-1/3 lg:w-1/4 border-r bg-muted/10 flex flex-col min-w-[300px]">
// // // //           <div className="p-4 border-b bg-muted/20">
// // // //             <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Curriculum</h2>
// // // //           </div>
// // // //           <ScrollArea className="flex-1 p-4">
// // // //             {nodes && (
// // // //               <NodeTree 
// // // //                 nodes={nodes} 
// // // //                 roadmapId={roadmapId} 
// // // //                 onSelectNode={setSelectedNode}
// // // //                 selectedNodeId={selectedNode?.id}
// // // //               />
// // // //             )}
// // // //           </ScrollArea>
// // // //         </div>

// // // //         {/* Right Panel: Content / Details */}
// // // //         <div className="flex-1 bg-background flex flex-col relative">
// // // //           {selectedNode ? (
// // // //             <div className="h-full overflow-y-auto custom-scrollbar p-6 max-w-3xl mx-auto w-full">
// // // //               <NodeDetail key={selectedNode.id} node={selectedNode} />
// // // //             </div>
// // // //           ) : (
// // // //             <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
// // // //               <div className="bg-muted/30 p-6 rounded-full mb-6">
// // // //                 <Layout className="h-12 w-12 opacity-50" />
// // // //               </div>
// // // //               <h3 className="text-xl font-medium mb-2 text-foreground">Select an item to view details</h3>
// // // //               <p className="max-w-md">
// // // //                 Click on any item in the curriculum list on the left to edit its details, add notes, or mark it as complete.
// // // //               </p>
// // // //             </div>
// // // //           )}
          
// // // //           {/* Mobile Overlay for Tree if needed (Optional for responsiveness) */}
// // // //           <div className="md:hidden absolute top-4 left-4">
// // // //              {/* Mobile view logic would go here if strictly required, but sidebar collapses on mobile typically */}
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }

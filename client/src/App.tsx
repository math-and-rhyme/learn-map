import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import RoadmapView from "@/pages/RoadmapView";
import TreeViewPage from "@/pages/TreeViewPage";
import FlowViewPage from "@/pages/FlowViewPage"; // No curly braces
import { queryClient } from "@/lib/queryClient";
// In your App.tsx or routing configuration

// Add this route

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/roadmap/:id/tree" component={TreeViewPage} />
        <Route path="/roadmap/:id/flow" component={FlowViewPage} />
        <Route path="/roadmap/:id" component={RoadmapView} />
        <Route>404: Page not found</Route>
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

// import { Switch, Route } from "wouter";
// import { queryClient } from "./lib/queryClient";
// import { QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { useAuth } from "@/hooks/use-auth";
// import NotFound from "@/pages/not-found";
// import Dashboard from "@/pages/Dashboard";
// import RoadmapView from "@/pages/RoadmapView";
// import Landing from "@/pages/Landing";
// import { Loader2 } from "lucide-react";

// function Router() {
//   const { user, isLoading } = useAuth();

//   if (isLoading) {
//     return (
//       <div className="h-screen w-full flex items-center justify-center bg-background">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   if (!user) {
//     return <Landing />;
//   }

//   return (
//     <Switch>
//       <Route path="/" component={Dashboard} />
//       <Route path="/roadmap/:id" component={RoadmapView} />
//       <Route component={NotFound} />
//     </Switch>
//   );
// }

// function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <Router />
//         <Toaster />
//       </TooltipProvider>
//     </QueryClientProvider>
//   );
// }

// export default App;

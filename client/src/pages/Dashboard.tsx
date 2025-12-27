import { useAuth } from "@/hooks/use-auth";
import { useRoadmaps } from "@/hooks/use-roadmaps";
import { Link } from "wouter";
import { CreateRoadmapDialog } from "@/components/CreateRoadmapDialog";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  LogOut, 
  Map, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  LayoutDashboard 
} from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { data: roadmaps, isLoading } = useRoadmaps();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Map className="h-6 w-6 text-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">LearnMap</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Welcome back, {user?.firstName || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={() => logout()} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        
        {/* Welcome Section */}
        <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">My Roadmaps</h1>
            <p className="text-muted-foreground">Manage your learning paths and track your progress.</p>
          </div>
          <CreateRoadmapDialog />
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : (
          /* Grid of Roadmaps */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps?.map((roadmap) => (
              <Link key={roadmap.id} href={`/roadmap/${roadmap.id}`} className="block group">
                <Card className="h-full border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="font-display text-xl group-hover:text-primary transition-colors">
                      {roadmap.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px]">
                      {roadmap.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{roadmap.dailyFocusTime}m / day</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>0% Done</span>
                      </div>
                    </div>
                    <Progress value={0} className="h-2" />
                  </CardContent>
                  <CardFooter className="pt-2 border-t border-border/30">
                    <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
                      <span>Updated {format(new Date(roadmap.updatedAt!), 'MMM d, yyyy')}</span>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}

            {/* Empty State */}
            {roadmaps?.length === 0 && (
              <div className="col-span-full py-20 text-center bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                  <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No roadmaps yet</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Create your first learning roadmap to start organizing your study materials and tracking goals.
                </p>
                <CreateRoadmapDialog />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

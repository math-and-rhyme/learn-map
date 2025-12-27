import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Layers, LineChart } from "lucide-react";
import heroImg from "@assets/hero.jpg"; // Mock import for structure

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-lg p-2 text-primary-foreground">
            <Layers className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">LearnMap</span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={handleLogin}>Log In</Button>
          <Button onClick={handleLogin}>Get Started</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 container mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 py-20">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            🚀 The ultimate learning companion
          </div>
          <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight tracking-tight">
            Structure your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
              knowledge journey
            </span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
            Create hierarchical roadmaps, track your progress, and master new skills with a structured approach to learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full" onClick={handleLogin}>
              Start Learning Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full">
              Explore Examples
            </Button>
          </div>
        </div>

        {/* Abstract Visual Representation */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
          <div className="relative z-10 bg-white dark:bg-card border shadow-2xl rounded-2xl p-6 rotate-2 hover:rotate-0 transition-all duration-500">
             <div className="flex items-center gap-4 mb-6 border-b pb-4">
               <div className="w-3 h-3 rounded-full bg-red-400"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
               <div className="w-3 h-3 rounded-full bg-green-400"></div>
             </div>
             <div className="space-y-4">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                     <BookOpen className="w-4 h-4" />
                   </div>
                   <div className="h-2 bg-muted rounded w-3/4"></div>
                 </div>
               ))}
               <div className="pl-8 space-y-3">
                 {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-px w-4 bg-border"></div>
                      <div className="h-2 bg-muted/50 rounded w-1/2"></div>
                    </div>
                 ))}
               </div>
             </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-10 -right-10 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">Why use LearnMap?</h2>
            <p className="text-muted-foreground">Most learning tools are just lists. LearnMap helps you build a curriculum.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Layers className="w-6 h-6 text-primary" />}
              title="Hierarchical Structure"
              description="Break down complex topics into modules, chapters, and individual lessons."
            />
            <FeatureCard 
              icon={<LineChart className="w-6 h-6 text-primary" />}
              title="Visual Progress"
              description="Track completion rates and time spent across different areas of your roadmap."
            />
            <FeatureCard 
              icon={<BookOpen className="w-6 h-6 text-primary" />}
              title="Resource Management"
              description="Attach articles, videos, and books directly to your learning nodes."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 text-center text-sm text-muted-foreground">
        <div className="container mx-auto">
          <p>© 2024 LearnMap. Built for lifelong learners.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-background p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-primary/5 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 font-display">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

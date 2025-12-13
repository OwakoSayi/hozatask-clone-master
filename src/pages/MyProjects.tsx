import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Calendar, MapPin, Plus, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface ProjectRequest {
  id: string;
  category: string;
  title: string;
  description: string;
  location: string;
  preferred_date: string | null;
  status: string;
  created_at: string;
  quotes_count?: number;
}

const MyProjects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { state: { returnTo: "/my-projects" } });
        return;
      }
      loadProjects();
    };
    checkAuthAndLoad();
  }, [navigate]);

  const loadProjects = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch projects with quote counts
      const { data: projectsData, error } = await supabase
        .from("project_requests")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get quote counts for each project
      const projectsWithCounts = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { count } = await supabase
            .from("quotes")
            .select("*", { count: "exact", head: true })
            .eq("request_id", project.id);
          return { ...project, quotes_count: count || 0 };
        })
      );

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast({
        title: "Error",
        description: "Failed to load your projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "in_progress": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "hired": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "completed": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "closed": return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      case "cancelled": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Projects</h1>
            <p className="text-muted-foreground">Track your project requests and quotes</p>
          </div>
          <Button onClick={() => navigate("/post-project")}>
            <Plus className="h-4 w-4 mr-2" />
            Post New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-semibold">No projects yet</h2>
              <p className="text-muted-foreground">
                Post a project to get quotes from local professionals
              </p>
              <Button onClick={() => navigate("/post-project")}>
                <Plus className="h-4 w-4 mr-2" />
                Post Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="secondary">{project.category}</Badge>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {project.location}
                        </span>
                        {project.preferred_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(project.preferred_date), "MMM d, yyyy")}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {project.quotes_count} {project.quotes_count === 1 ? "quote" : "quotes"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MyProjects;

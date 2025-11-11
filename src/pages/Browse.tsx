import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Star, DollarSign } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Task {
  id: string;
  title: string;
  description: string;
  hourly_rate: number;
  location: string;
  tasker_id: string;
  category_id: string;
  tasker_name?: string;
  avatar_url?: string | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
  categories: {
    name: string;
  };
  avg_rating?: number;
  review_count?: number;
}

export default function Browse() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          profiles!tasks_tasker_id_fkey(full_name, avatar_url),
          categories(name)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get ratings for each tasker
      const tasksWithRatings = await Promise.all(
        (data || []).map(async (task) => {
          const { data: reviews } = await supabase
            .from("reviews")
            .select("rating")
            .eq("reviewee_id", task.tasker_id);

          const ratings = reviews || [];
          const avg_rating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

          return {
            ...task,
            tasker_name: task.profiles.full_name,
            avatar_url: task.profiles.avatar_url,
            avg_rating,
            review_count: ratings.length,
          };
        })
      );

      setTasks(tasksWithRatings);
    } catch (error: any) {
      console.error("Error loading tasks:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.categories.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Browse Available Services</h1>
            <Input
              placeholder="Search by service, category, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">Loading services...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No services found. Try adjusting your search.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-14 w-14 ring-2 ring-accent/20">
                        <AvatarImage src={task.avatar_url || undefined} />
                        <AvatarFallback className="text-lg font-semibold bg-accent/10 text-accent">
                          {task.tasker_name?.charAt(0) || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-base">{task.tasker_name}</p>
                        {task.avg_rating && (
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{task.avg_rating.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">({task.review_count} reviews)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <CardTitle className="line-clamp-1">{task.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <span className="font-medium">{task.categories.name}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="font-semibold">R{task.hourly_rate}/hour</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{task.location}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      View Details & Book
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2, MapPin, Star, Briefcase, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  full_name: string;
  avatar_url: string;
  bio: string;
  phone: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  location: string;
  hourly_rate: number;
  category_id: string;
  is_active: boolean;
  categories: {
    name: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

const TaskerPublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (id) {
      loadTaskerData();
    }
  }, [id]);

  const loadTaskerData = async () => {
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          categories (name)
        `)
        .eq("tasker_id", id)
        .eq("is_active", true);

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Load reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles!reviewer_id (
            full_name,
            avatar_url
          )
        `)
        .eq("reviewee_id", id)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // Calculate average rating
      if (reviewsData && reviewsData.length > 0) {
        const total = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        setAvgRating(total / reviewsData.length);
        setReviewCount(reviewsData.length);
      }
    } catch (error) {
      console.error("Error loading tasker data:", error);
      toast({
        title: "Error",
        description: "Failed to load tasker profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-accent text-accent" : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-bold">Tasker not found</h2>
          <Button onClick={() => navigate("/browse")}>Browse Taskers</Button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>
                    <User className="h-16 w-16" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
                  {reviewCount > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      {renderStars(Math.round(avgRating))}
                      <span className="text-lg font-semibold">{avgRating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({reviewCount} reviews)</span>
                    </div>
                  )}
                  {profile.bio && (
                    <p className="text-muted-foreground mb-4">{profile.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {tasks.length} Services
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Services Offered</h2>
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No active services at the moment
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/task/${task.id}`)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl mb-1">{task.title}</CardTitle>
                          <Badge variant="secondary">{task.categories.name}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">R{task.hourly_rate}</div>
                          <div className="text-sm text-muted-foreground">per hour</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-2">{task.description}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {task.location}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Reviews</h2>
            {reviews.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No reviews yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.profiles.avatar_url} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold">{review.profiles.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {renderStars(review.rating)}
                          </div>
                          {review.comment && (
                            <p className="text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TaskerPublicProfile;

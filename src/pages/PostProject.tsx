import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { CategoryCombobox } from "@/components/CategoryCombobox";

const PostProject = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedCategory = searchParams.get("category") || "";

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    category: preselectedCategory,
    title: "",
    description: "",
    location: "",
    zip_code: "",
    preferred_date: "",
    preferred_time: "",
    budget_min: "",
    budget_max: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Login Required",
          description: "Please sign in to post a project request",
        });
        navigate("/auth", { state: { returnTo: `/post-project?category=${preselectedCategory}` } });
      }
    };
    checkAuth();
  }, [navigate, toast, preselectedCategory]);

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1 && !formData.category) {
      toast({ title: "Required", description: "Please select a category", variant: "destructive" });
      return;
    }
    if (currentStep === 2 && (!formData.title || !formData.description)) {
      toast({ title: "Required", description: "Please fill in the project details", variant: "destructive" });
      return;
    }
    if (currentStep === 3 && !formData.location) {
      toast({ title: "Required", description: "Please enter your location", variant: "destructive" });
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase.from("project_requests").insert({
        user_id: session.user.id,
        category: formData.category,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        zip_code: formData.zip_code || null,
        preferred_date: formData.preferred_date || null,
        preferred_time: formData.preferred_time || null,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Project Posted!",
        description: "Pros will start sending you quotes soon",
      });
    } catch (error) {
      console.error("Error posting project:", error);
      toast({
        title: "Error",
        description: "Failed to post project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex-1 max-w-2xl">
          <Card className="text-center py-12">
            <CardContent className="space-y-6">
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
              <h1 className="text-2xl font-bold">Your Project Has Been Posted!</h1>
              <p className="text-muted-foreground">
                Pros in your area will review your request and send quotes. 
                You'll be notified when you receive responses.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button onClick={() => navigate("/my-projects")}>
                  View My Projects
                </Button>
                <Button variant="outline" onClick={() => navigate("/suppliers")}>
                  Browse Pros
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          ← Back
        </Button>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step 1: Category */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>What type of service do you need?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Select a Category *</Label>
                <CategoryCombobox
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  placeholder="Search for a service..."
                />
              </div>
              <Button onClick={handleNext} className="w-full" size="lg">
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Project Details */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Tell us about your project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Deep cleaning for 3-bedroom house"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Describe what you need *</Label>
                <Textarea
                  id="description"
                  rows={5}
                  placeholder="Provide details about your project, specific requirements, or preferences..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrevious} className="flex-1">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Location & Timing */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Where and when?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="City or area (e.g., Sandton, Johannesburg)"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="zip_code">Postal/Zip Code (optional)</Label>
                <Input
                  id="zip_code"
                  placeholder="e.g., 2196"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferred_date">Preferred Date</Label>
                  <Input
                    id="preferred_date"
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="preferred_time">Preferred Time</Label>
                  <Input
                    id="preferred_time"
                    type="time"
                    value={formData.preferred_time}
                    onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrevious} className="flex-1">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Budget & Review */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Budget & Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Budget Range (optional)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Min (R)"
                    value={formData.budget_min}
                    onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Max (R)"
                    value={formData.budget_max}
                    onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                <h3 className="font-semibold">Review Your Request</h3>
                <div className="text-sm space-y-2">
                  <p><span className="text-muted-foreground">Category:</span> {formData.category}</p>
                  <p><span className="text-muted-foreground">Title:</span> {formData.title}</p>
                  <p><span className="text-muted-foreground">Location:</span> {formData.location}</p>
                  {formData.preferred_date && (
                    <p><span className="text-muted-foreground">Date:</span> {formData.preferred_date}</p>
                  )}
                  {(formData.budget_min || formData.budget_max) && (
                    <p>
                      <span className="text-muted-foreground">Budget:</span> R{formData.budget_min || "0"} - R{formData.budget_max || "Open"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrevious} className="flex-1">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                  {loading ? "Posting..." : "Post Project"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PostProject;

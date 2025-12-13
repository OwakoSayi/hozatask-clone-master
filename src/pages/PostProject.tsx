import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, CheckCircle, Upload, X, Loader2, Bell, Clock, Shield } from "lucide-react";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { uploadImagesParallel } from "@/lib/uploadImages";
import { supabase } from "@/integrations/supabase/client";
import { MatchingPros } from "@/components/MatchingPros";

const PostProject = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedCategory = searchParams.get("category") || "";

  const { user, loading: userLoading } = useUser();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    category: preselectedCategory,
    title: "",
    description: "",
    property_type: "",
    scope_size: "",
    location: "",
    zip_code: "",
    preferred_date: "",
    preferred_time: "",
    date_flexibility: "specific",
    budget_min: "",
    budget_max: "",
  });

  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!userLoading && !user) {
      toast({
        title: "Login Required",
        description: "Please sign in to post a project request",
      });
      navigate("/auth", { state: { returnTo: `/post-project?category=${preselectedCategory}` } });
    }
  }, [user, userLoading, navigate, toast, preselectedCategory]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: "Maximum 5 images allowed.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Upload all images in parallel for speed
      const uploadedUrls = await uploadImagesParallel(
        Array.from(files),
        "project-images"
      );
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.from("project_requests").insert({
        user_id: user.id,
        category: formData.category,
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type || null,
        scope_size: formData.scope_size || null,
        location: formData.location,
        zip_code: formData.zip_code || null,
        preferred_date: formData.preferred_date || null,
        preferred_time: formData.preferred_time || null,
        date_flexibility: formData.date_flexibility,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        images: images.length > 0 ? images : null,
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
        <div className="container mx-auto px-4 py-8 flex-1 max-w-3xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 border-4 border-green-200 rounded-full animate-ping opacity-30" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Your request is live!</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              We found pros who match your {formData.category} project in {formData.location}
            </p>
          </div>

          {/* What happens next */}
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <h3 className="font-semibold mb-3 text-sm">What happens next?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Receive quotes</p>
                    <p className="text-xs text-muted-foreground">Pros will send personalized quotes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Compare & chat</p>
                    <p className="text-xs text-muted-foreground">Review options and ask questions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Hire with confidence</p>
                    <p className="text-xs text-muted-foreground">Book your chosen pro securely</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Matching Pros - Thumbtack style instant results */}
          <div className="mb-6">
            <MatchingPros 
              category={formData.category} 
              location={formData.location}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate("/my-projects")} size="lg">
              Track My Projects
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
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

        {/* Step 2: Project Details - Guided Questions */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Tell us about your project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">What do you need done? *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Deep cleaning for 3-bedroom house"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <Label>Property type</Label>
                <RadioGroup 
                  value={formData.property_type} 
                  onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                  className="grid grid-cols-2 gap-3 mt-2"
                >
                  {["House", "Flat/Apartment", "Office", "Other"].map((type) => (
                    <div key={type} className={cn(
                      "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                      formData.property_type === type.toLowerCase() && "border-primary bg-primary/5"
                    )}>
                      <RadioGroupItem value={type.toLowerCase()} id={type.toLowerCase()} />
                      <Label htmlFor={type.toLowerCase()} className="cursor-pointer">{type}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Project size/scope</Label>
                <RadioGroup 
                  value={formData.scope_size} 
                  onValueChange={(value) => setFormData({ ...formData, scope_size: value })}
                  className="grid grid-cols-3 gap-3 mt-2"
                >
                  {["Small", "Medium", "Large"].map((size) => (
                    <div key={size} className={cn(
                      "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                      formData.scope_size === size.toLowerCase() && "border-primary bg-primary/5"
                    )}>
                      <RadioGroupItem value={size.toLowerCase()} id={`size-${size.toLowerCase()}`} />
                      <Label htmlFor={`size-${size.toLowerCase()}`} className="cursor-pointer">{size}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="description">Describe what you need *</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Provide details about your project, specific requirements, or preferences..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label>Add photos (optional)</Label>
                <div className={cn(
                  "mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                  "hover:border-primary/50 hover:bg-primary/5"
                )}>
                  <input
                    type="file"
                    id="images"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  <label htmlFor="images" className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">Click to upload photos</p>
                      </>
                    )}
                  </label>
                </div>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {images.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded overflow-hidden group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

        {/* Step 3: Location */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Where is the project?</CardTitle>
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

        {/* Step 4: Timing */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>When do you need this done?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Date flexibility</Label>
                <RadioGroup 
                  value={formData.date_flexibility} 
                  onValueChange={(value) => setFormData({ ...formData, date_flexibility: value })}
                  className="space-y-3 mt-2"
                >
                  <div className={cn(
                    "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                    formData.date_flexibility === "specific" && "border-primary bg-primary/5"
                  )}>
                    <RadioGroupItem value="specific" id="specific" />
                    <Label htmlFor="specific" className="cursor-pointer flex-1">I have a specific date in mind</Label>
                  </div>
                  <div className={cn(
                    "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                    formData.date_flexibility === "flexible" && "border-primary bg-primary/5"
                  )}>
                    <RadioGroupItem value="flexible" id="flexible" />
                    <Label htmlFor="flexible" className="cursor-pointer flex-1">I'm flexible on dates</Label>
                  </div>
                  <div className={cn(
                    "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                    formData.date_flexibility === "asap" && "border-primary bg-primary/5"
                  )}>
                    <RadioGroupItem value="asap" id="asap" />
                    <Label htmlFor="asap" className="cursor-pointer flex-1">As soon as possible</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.date_flexibility === "specific" && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
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
              )}

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

        {/* Step 5: Budget & Review */}
        {currentStep === 5 && (
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
                  {formData.property_type && (
                    <p><span className="text-muted-foreground">Property:</span> {formData.property_type}</p>
                  )}
                  {formData.date_flexibility === "specific" && formData.preferred_date && (
                    <p><span className="text-muted-foreground">Date:</span> {formData.preferred_date}</p>
                  )}
                  {formData.date_flexibility === "flexible" && (
                    <p><span className="text-muted-foreground">Timing:</span> Flexible dates</p>
                  )}
                  {formData.date_flexibility === "asap" && (
                    <p><span className="text-muted-foreground">Timing:</span> As soon as possible</p>
                  )}
                  {(formData.budget_min || formData.budget_max) && (
                    <p>
                      <span className="text-muted-foreground">Budget:</span> R{formData.budget_min || "0"} - R{formData.budget_max || "Open"}
                    </p>
                  )}
                  {images.length > 0 && (
                    <p><span className="text-muted-foreground">Photos:</span> {images.length} attached</p>
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

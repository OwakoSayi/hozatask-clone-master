import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { Upload, X, Loader2, Check, ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

// Validation schemas
const stepSchemas = {
  step1: z.object({
    category: z.string().min(1, "Please select a service category"),
    location: z.string().min(2, "Please enter your location").max(100),
  }),
  step2: z.object({
    business_name: z.string().min(2, "Business name must be at least 2 characters").max(100),
    title: z.string().min(5, "Service title must be at least 5 characters").max(150),
  }),
  step3: z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    full_name: z.string().min(2, "Please enter your full name").max(100),
    phone: z.string().min(10, "Please enter a valid phone number").max(20),
  }),
  step4: z.object({
    price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Please enter a valid price"),
    description: z.string().min(50, "Description must be at least 50 characters").max(2000),
  }),
};

const STEPS = [
  { id: 1, title: "Service", description: "What do you do?" },
  { id: 2, title: "Business", description: "Tell us about your business" },
  { id: 3, title: "Account", description: "Create your account" },
  { id: 4, title: "Details", description: "Pricing & description" },
  { id: 5, title: "Photos", description: "Show your work" },
];

const ProSignup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingUser, setExistingUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [formData, setFormData] = useState({
    // Step 1
    category: searchParams.get("category") || "",
    location: searchParams.get("location") || "",
    // Step 2
    business_name: "",
    title: "",
    // Step 3
    email: "",
    password: "",
    full_name: "",
    phone: "",
    // Step 4
    price: "",
    time_frame: "per service",
    description: "",
  });

  const [images, setImages] = useState<string[]>([]);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setExistingUser(session.user);
        
        // Check if already a supplier
        const { data: supplier } = await supabase
          .from("suppliers")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();
          
        if (supplier) {
          if (supplier.status === "Active") {
            navigate("/pro-dashboard");
          } else {
            toast({
              title: "Application Pending",
              description: "Your listing is under review.",
            });
            navigate("/account");
          }
          return;
        }

        // Pre-fill from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile) {
          setFormData(prev => ({
            ...prev,
            email: session.user.email || "",
            full_name: profile.full_name || "",
            phone: profile.phone || "",
            location: prev.location || profile.city || "",
          }));
          // Skip to step 1 if logged in (account step will be auto-skipped)
        }
      }
      setCheckingAuth(false);
    };
    
    checkAuth();
  }, [navigate, toast]);

  const progress = (currentStep / STEPS.length) * 100;

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    try {
      switch (step) {
        case 1:
          stepSchemas.step1.parse({ category: formData.category, location: formData.location });
          break;
        case 2:
          stepSchemas.step2.parse({ business_name: formData.business_name, title: formData.title });
          break;
        case 3:
          if (!existingUser) {
            stepSchemas.step3.parse({
              email: formData.email,
              password: formData.password,
              full_name: formData.full_name,
              phone: formData.phone,
            });
          }
          break;
        case 4:
          stepSchemas.step4.parse({ price: formData.price, description: formData.description });
          break;
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    // If on account step and user exists, skip
    if (currentStep === 3 && existingUser) {
      setCurrentStep(4);
      return;
    }

    // If completing account step, create account first
    if (currentStep === 3 && !existingUser) {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/pro-dashboard`,
            data: {
              full_name: formData.full_name,
              phone: formData.phone,
              address: "",
              city: formData.location,
              province: "",
            },
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Account Exists",
              description: "Please login with your existing account.",
              variant: "destructive",
            });
            navigate("/auth", { state: { returnTo: "/become-pro/signup" } });
            return;
          }
          throw error;
        }

        if (data.user) {
          setExistingUser(data.user);
          toast({
            title: "Account created!",
            description: "Let's continue setting up your profile.",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to create account",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    // If going back to step 3 and user exists, skip to step 2
    if (currentStep === 4 && existingUser) {
      setCurrentStep(2);
      return;
    }
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 10) {
      toast({
        title: "Too many images",
        description: "Maximum 10 images allowed.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `supplier-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }
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
    if (!existingUser) {
      toast({
        title: "Error",
        description: "Please complete account creation first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("suppliers").insert({
        user_id: existingUser.id,
        business_name: formData.business_name.trim(),
        contact_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        whatsapp: formData.phone.trim(),
        location: formData.location.trim(),
        category: formData.category,
        title: formData.title.trim(),
        price: parseFloat(formData.price),
        time_frame: formData.time_frame,
        description: formData.description.trim(),
        images: images.length > 0 ? images : null,
        status: "Pending",
      });

      if (error) throw error;

      toast({
        title: "You're all set!",
        description: "Your profile is under review. We'll notify you once approved.",
      });

      navigate("/account");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create listing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">What service do you provide?</h2>
              <p className="text-muted-foreground">Help customers find you by selecting your main service</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-base">Service Category *</Label>
                <CategoryCombobox
                  value={formData.category}
                  onValueChange={(val) => updateFormData("category", val)}
                  placeholder="Search for your service..."
                />
                {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
              </div>
              
              <div>
                <Label className="text-base">Where are you located? *</Label>
                <SearchAutocomplete
                  type="location"
                  value={formData.location}
                  onChange={(val) => updateFormData("location", val)}
                  placeholder="e.g., Johannesburg, Cape Town"
                />
                {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Tell us about your business</h2>
              <p className="text-muted-foreground">This helps build trust with potential customers</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-base">Business Name *</Label>
                <Input
                  value={formData.business_name}
                  onChange={(e) => updateFormData("business_name", e.target.value)}
                  placeholder="e.g., John's Plumbing Services"
                  maxLength={100}
                />
                {errors.business_name && <p className="text-sm text-destructive mt-1">{errors.business_name}</p>}
              </div>
              
              <div>
                <Label className="text-base">Service Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateFormData("title", e.target.value)}
                  placeholder="e.g., Professional Plumbing & Drain Cleaning"
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A catchy title that describes what you do
                </p>
                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
              </div>
            </div>
          </div>
        );

      case 3:
        if (existingUser) {
          return (
            <div className="text-center py-12">
              <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">You're already signed in!</h2>
              <p className="text-muted-foreground">
                Signed in as {existingUser.email}
              </p>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Create your account</h2>
              <p className="text-muted-foreground">We'll use this to manage your pro profile</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-base">Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => updateFormData("full_name", e.target.value)}
                  placeholder="Your full name"
                  maxLength={100}
                />
                {errors.full_name && <p className="text-sm text-destructive mt-1">{errors.full_name}</p>}
              </div>
              
              <div>
                <Label className="text-base">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <Label className="text-base">Phone Number *</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  placeholder="+27 XX XXX XXXX"
                  maxLength={20}
                />
                {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
              </div>
              
              <div>
                <Label className="text-base">Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    placeholder="Create a password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Set your pricing</h2>
              <p className="text-muted-foreground">Tell customers about your rates and services</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base">Starting Price (R) *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => updateFormData("price", e.target.value)}
                    placeholder="e.g., 500"
                    min="0"
                  />
                  {errors.price && <p className="text-sm text-destructive mt-1">{errors.price}</p>}
                </div>
                
                <div>
                  <Label className="text-base">Price Basis</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={formData.time_frame}
                    onChange={(e) => updateFormData("time_frame", e.target.value)}
                  >
                    <option value="per service">Per Service</option>
                    <option value="per hour">Per Hour</option>
                    <option value="per day">Per Day</option>
                    <option value="per session">Per Session</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label className="text-base">Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  placeholder="Describe your services, experience, and what makes you stand out. Be detailed - this helps customers choose you!"
                  rows={6}
                  maxLength={2000}
                />
                <div className="flex justify-between mt-1">
                  {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                  <p className="text-xs text-muted-foreground ml-auto">
                    {formData.description.length}/2000
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Show off your work</h2>
              <p className="text-muted-foreground">Photos help customers see what you can do</p>
            </div>
            
            <div>
              <Label className="text-base">Upload Photos (Optional)</Label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
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
                    <Loader2 className="h-10 w-10 mx-auto text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {uploading ? "Uploading..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB each</p>
                </label>
              </div>
              
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">What happens next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• We'll review your profile within 24 hours</li>
                <li>• Once approved, you'll get 3 free credits to start</li>
                <li>• Use credits to respond to customer leads</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 py-8">
        <div className="container max-w-2xl mx-auto px-4">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Step {currentStep} of {STEPS.length}</span>
              <span className="text-muted-foreground">{STEPS[currentStep - 1].title}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="hidden md:flex justify-between mb-8">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 ${
                  step.id === currentStep
                    ? "text-primary"
                    : step.id < currentStep
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className="text-sm hidden lg:inline">{step.title}</span>
              </div>
            ))}
          </div>

          {/* Form Card */}
          <Card className="shadow-lg">
            <CardContent className="p-6 md:p-8">
              {renderStepContent()}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1 || loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {currentStep < STEPS.length ? (
                  <Button onClick={handleNext} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {currentStep === 3 && !existingUser ? "Create Account & Continue" : "Continue"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Complete Setup
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Login link */}
          {!existingUser && currentStep <= 3 && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => navigate("/auth", { state: { returnTo: "/become-pro/signup" } })}
              >
                Sign in
              </Button>
            </p>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ProSignup;

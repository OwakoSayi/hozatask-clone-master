import { useState, useEffect, useRef } from "react";
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
import { Upload, X, Loader2, Check, ArrowLeft, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const formRef = useRef<HTMLDivElement>(null);

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
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          setCheckingAuth(false);
          return;
        }

        setExistingUser(session.user);

        // Run supplier and profile checks in parallel for faster loading
        const [supplierResult, profileResult] = await Promise.all([
          supabase
            .from("suppliers")
            .select("id, status")
            .eq("user_id", session.user.id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("full_name, phone, city")
            .eq("id", session.user.id)
            .maybeSingle(),
        ]);

        if (supplierResult.error) {
          throw supplierResult.error;
        }

        if (profileResult.error) {
          throw profileResult.error;
        }

        const supplier = supplierResult.data;
        const profile = profileResult.data;

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

        // Pre-fill from profile if exists
        if (profile) {
          setFormData((prev) => ({
            ...prev,
            email: session.user.email || "",
            full_name: profile.full_name || "",
            phone: profile.phone || "",
            location: prev.location || profile.city || "",
          }));
        }
      } catch (error) {
        console.error("Error checking auth for pro signup:", error);
        // Fail open so user can still proceed with signup instead of being stuck on loader
      } finally {
        setCheckingAuth(false);
      }
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

    animateStepTransition('right', Math.min(currentStep + 1, STEPS.length));
  };

  const handleBack = () => {
    // If going back to step 3 and user exists, skip to step 2
    if (currentStep === 4 && existingUser) {
      animateStepTransition('left', 2);
      return;
    }
    animateStepTransition('left', Math.max(currentStep - 1, 1));
  };

  const animateStepTransition = (direction: 'left' | 'right', nextStep: number) => {
    if (nextStep === currentStep) return;
    setSlideDirection(direction);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(nextStep);
      setIsTransitioning(false);
    }, 200);
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

  // Animated form field wrapper component
  const AnimatedField = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
    <div 
      className="animate-fade-in opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {children}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-scale-in">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 animate-fade-in">What service do you provide?</h2>
              <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
                Help customers find you by selecting your main service
              </p>
            </div>
            
            <div className="space-y-4">
              <AnimatedField delay={150}>
                <div className="group">
                  <Label className="text-base transition-colors group-focus-within:text-primary">Service Category *</Label>
                  <div className="mt-1.5 transition-transform duration-200 focus-within:scale-[1.01]">
                    <CategoryCombobox
                      value={formData.category}
                      onValueChange={(val) => updateFormData("category", val)}
                      placeholder="Search for your service..."
                    />
                  </div>
                  {errors.category && (
                    <p className="text-sm text-destructive mt-1 animate-fade-in">{errors.category}</p>
                  )}
                </div>
              </AnimatedField>
              
              <AnimatedField delay={250}>
                <div className="group">
                  <Label className="text-base transition-colors group-focus-within:text-primary">Where are you located? *</Label>
                  <div className="mt-1.5 transition-transform duration-200 focus-within:scale-[1.01]">
                    <SearchAutocomplete
                      type="location"
                      value={formData.location}
                      onChange={(val) => updateFormData("location", val)}
                      placeholder="e.g., Johannesburg, Cape Town"
                    />
                  </div>
                  {errors.location && (
                    <p className="text-sm text-destructive mt-1 animate-fade-in">{errors.location}</p>
                  )}
                </div>
              </AnimatedField>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-scale-in">
                <span className="text-2xl">🏢</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 animate-fade-in">Tell us about your business</h2>
              <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
                This helps build trust with potential customers
              </p>
            </div>
            
            <div className="space-y-4">
              <AnimatedField delay={150}>
                <div className="group">
                  <Label className="text-base transition-colors group-focus-within:text-primary">Business Name *</Label>
                  <Input
                    value={formData.business_name}
                    onChange={(e) => updateFormData("business_name", e.target.value)}
                    placeholder="e.g., John's Plumbing Services"
                    maxLength={100}
                    className="mt-1.5 transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                  />
                  {errors.business_name && (
                    <p className="text-sm text-destructive mt-1 animate-fade-in">{errors.business_name}</p>
                  )}
                </div>
              </AnimatedField>
              
              <AnimatedField delay={250}>
                <div className="group">
                  <Label className="text-base transition-colors group-focus-within:text-primary">Service Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => updateFormData("title", e.target.value)}
                    placeholder="e.g., Professional Plumbing & Drain Cleaning"
                    maxLength={150}
                    className="mt-1.5 transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A catchy title that describes what you do
                  </p>
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1 animate-fade-in">{errors.title}</p>
                  )}
                </div>
              </AnimatedField>
            </div>
          </div>
        );

      case 3:
        if (existingUser) {
          return (
            <div className="text-center py-12 animate-scale-in">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                <Check className="h-10 w-10 text-green-600 animate-[bounce_0.5s_ease-in-out]" />
              </div>
              <h2 className="text-2xl font-bold mb-2 animate-fade-in">You're already signed in!</h2>
              <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
                Signed in as {existingUser.email}
              </p>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-scale-in">
                <span className="text-2xl">👤</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 animate-fade-in">Create your account</h2>
              <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
                We'll use this to manage your pro profile
              </p>
            </div>
            
            <div className="space-y-4">
              <AnimatedField delay={150}>
                <div className="group">
                  <Label className="text-base transition-colors group-focus-within:text-primary">Full Name *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => updateFormData("full_name", e.target.value)}
                    placeholder="Your full name"
                    maxLength={100}
                    className="mt-1.5 transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                  />
                  {errors.full_name && (
                    <p className="text-sm text-destructive mt-1 animate-fade-in">{errors.full_name}</p>
                  )}
                </div>
              </AnimatedField>
              
              <AnimatedField delay={200}>
                <div className="group">
                  <Label className="text-base transition-colors group-focus-within:text-primary">Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1 animate-fade-in">{errors.email}</p>
                  )}
                </div>
              </AnimatedField>
              
              <AnimatedField delay={250}>
                <div className="group">
                  <Label className="text-base transition-colors group-focus-within:text-primary">Phone Number *</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    placeholder="+27 XX XXX XXXX"
                    maxLength={20}
                    className="mt-1.5 transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1 animate-fade-in">{errors.phone}</p>
                  )}
                </div>
              </AnimatedField>
              
              <AnimatedField delay={300}>
                <div className="group">
                  <Label className="text-base transition-colors group-focus-within:text-primary">Password *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => updateFormData("password", e.target.value)}
                      placeholder="Create a password"
                      className="pr-10 transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 transition-transform hover:scale-110" />
                      ) : (
                        <Eye className="h-4 w-4 transition-transform hover:scale-110" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1 animate-fade-in">{errors.password}</p>
                  )}
                </div>
              </AnimatedField>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-scale-in">
                <span className="text-2xl">💰</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 animate-fade-in">Set your pricing</h2>
              <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
                Tell customers about your rates and services
              </p>
            </div>
            
            <div className="space-y-4">
              <AnimatedField delay={150}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <Label className="text-base transition-colors group-focus-within:text-primary">Starting Price (R) *</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => updateFormData("price", e.target.value)}
                      placeholder="e.g., 500"
                      min="0"
                      className="mt-1.5 transition-all duration-200 focus:scale-[1.01] focus:shadow-md"
                    />
                    {errors.price && (
                      <p className="text-sm text-destructive mt-1 animate-fade-in">{errors.price}</p>
                    )}
                  </div>
                  
                  <div className="group">
                    <Label className="text-base transition-colors group-focus-within:text-primary">Price Basis</Label>
                    <select
                      className="w-full h-10 mt-1.5 rounded-md border border-input bg-background px-3 text-sm transition-all duration-200 focus:scale-[1.01] focus:shadow-md focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
              </AnimatedField>
              
              <AnimatedField delay={250}>
                <div className="group">
                  <Label className="text-base transition-colors group-focus-within:text-primary">Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Describe your services, experience, and what makes you stand out. Be detailed - this helps customers choose you!"
                    rows={6}
                    maxLength={2000}
                    className="mt-1.5 transition-all duration-200 focus:scale-[1.005] focus:shadow-md"
                  />
                  <div className="flex justify-between mt-1">
                    {errors.description && (
                      <p className="text-sm text-destructive animate-fade-in">{errors.description}</p>
                    )}
                    <p className={cn(
                      "text-xs ml-auto transition-colors",
                      formData.description.length >= 50 ? "text-green-600" : "text-muted-foreground"
                    )}>
                      {formData.description.length}/2000
                      {formData.description.length >= 50 && " ✓"}
                    </p>
                  </div>
                </div>
              </AnimatedField>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-scale-in">
                <span className="text-2xl">📸</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 animate-fade-in">Show off your work</h2>
              <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
                Photos help customers see what you can do
              </p>
            </div>
            
            <AnimatedField delay={150}>
              <div>
                <Label className="text-base">Upload Photos (Optional)</Label>
                <div className={cn(
                  "mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer",
                  "hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01]",
                  uploading && "border-primary bg-primary/5"
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
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="mt-2 text-sm text-primary font-medium">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground transition-transform group-hover:scale-110" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB each</p>
                      </>
                    )}
                  </label>
                </div>
                
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {images.map((url, idx) => (
                      <div 
                        key={idx} 
                        className="relative aspect-square rounded-lg overflow-hidden group animate-scale-in"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AnimatedField>
            
            <AnimatedField delay={300}>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  What happens next?
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    We'll review your profile within 24 hours
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    Once approved, you'll get 3 free credits to start
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    Use credits to respond to customer leads
                  </li>
                </ul>
              </div>
            </AnimatedField>
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
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-2 transition-all duration-300",
                  step.id === currentStep && "text-primary scale-105",
                  step.id < currentStep && "text-muted-foreground",
                  step.id > currentStep && "text-muted-foreground/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                    step.id < currentStep && "bg-primary text-primary-foreground",
                    step.id === currentStep && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    step.id > currentStep && "bg-muted"
                  )}
                >
                  {step.id < currentStep ? (
                    <Check className="h-4 w-4 animate-scale-in" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="text-sm hidden lg:inline">{step.title}</span>
              </div>
            ))}
          </div>

          {/* Form Card */}
          <Card className="shadow-lg overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div
                ref={formRef}
                className={cn(
                  "transition-all duration-200",
                  isTransitioning && slideDirection === 'right' && "opacity-0 -translate-x-4",
                  isTransitioning && slideDirection === 'left' && "opacity-0 translate-x-4",
                  !isTransitioning && "opacity-100 translate-x-0"
                )}
              >
                {renderStepContent()}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1 || loading || isTransitioning}
                  className="group transition-all duration-200 hover:gap-3"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                  Back
                </Button>

                {currentStep < STEPS.length ? (
                  <Button 
                    onClick={handleNext} 
                    disabled={loading || isTransitioning}
                    className="group transition-all duration-200 hover:gap-3"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {currentStep === 3 && !existingUser ? "Create Account & Continue" : "Continue"}
                    <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading || isTransitioning} 
                    className="bg-green-600 hover:bg-green-700 group transition-all duration-200"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
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

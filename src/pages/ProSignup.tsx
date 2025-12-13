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
import { Upload, X, Loader2, Check, ArrowLeft, ArrowRight, Eye, EyeOff, Sparkles, MapPin, Users, Briefcase } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

// Validation schemas
const stepSchemas = {
  step1: z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    full_name: z.string().min(2, "Please enter your full name").max(100),
    phone: z.string().min(10, "Please enter a valid phone number").max(20),
  }),
  step2: z.object({
    category: z.string().min(1, "Please select at least one service"),
  }),
  step3: z.object({
    location: z.string().min(2, "Please enter your location").max(100),
  }),
  step4: z.object({
    business_name: z.string().min(2, "Business name must be at least 2 characters").max(100),
    description: z.string().min(50, "Description must be at least 50 characters").max(2000),
  }),
  step5: z.object({
    price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Please enter a valid price"),
  }),
};

const STEPS = [
  { id: 1, title: "Account", description: "Create your account" },
  { id: 2, title: "Services", description: "What do you do?" },
  { id: 3, title: "Service Area", description: "Where do you work?" },
  { id: 4, title: "Business Profile", description: "Tell us about your business" },
  { id: 5, title: "Pricing", description: "Work preferences & pricing" },
  { id: 6, title: "Photos", description: "Show your work" },
  { id: 7, title: "Lead Setup", description: "How to get leads" },
];

// Moved outside component to prevent re-renders causing input focus loss
const AnimatedField = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <div 
    className="animate-fade-in opacity-0"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
  >
    {children}
  </div>
);

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
    // Step 1 - Account
    email: "",
    password: "",
    full_name: "",
    phone: "",
    // Step 2 - Services
    category: searchParams.get("category") || "",
    // Step 3 - Service Area
    location: searchParams.get("location") || "",
    service_radius_km: "50",
    travel_preference: "to_customer",
    // Step 4 - Business Profile
    business_name: "",
    years_in_business: "",
    employee_count: "just_me",
    description: "",
    licenses: [] as string[],
    // Step 5 - Pricing
    price: "",
    time_frame: "per service",
    show_prices: true,
    // Step 7 - Lead Setup
    lead_mode: "manual",
    monthly_budget_cap: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

        // Pre-fill from profile if exists - skip to step 2
        if (profile) {
          setFormData((prev) => ({
            ...prev,
            email: session.user.email || "",
            full_name: profile.full_name || "",
            phone: profile.phone || "",
            location: prev.location || profile.city || "",
          }));
          setCurrentStep(2); // Skip account creation step
        }
      } catch (error) {
        console.error("Error checking auth for pro signup:", error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);


  const progress = (currentStep / STEPS.length) * 100;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          if (!existingUser) {
            if (!agreedToTerms) {
              setErrors({ terms: "You must agree to the terms and privacy policy" });
              return false;
            }
            stepSchemas.step1.parse({
              email: formData.email,
              password: formData.password,
              full_name: formData.full_name,
              phone: formData.phone,
            });
          }
          break;
        case 2:
          stepSchemas.step2.parse({ category: formData.category });
          break;
        case 3:
          stepSchemas.step3.parse({ location: formData.location });
          break;
        case 4:
          stepSchemas.step4.parse({ 
            business_name: formData.business_name, 
            description: formData.description 
          });
          break;
        case 5:
          stepSchemas.step5.parse({ price: formData.price });
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

    // If on account step and no existing user, create account
    if (currentStep === 1 && !existingUser) {
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
    // If on step 2 and user exists, can't go back to account creation
    if (currentStep === 2 && existingUser) {
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
      // Create supplier profile
      const { data: supplierData, error: supplierError } = await supabase.from("suppliers").insert({
        user_id: existingUser.id,
        business_name: formData.business_name.trim(),
        contact_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        whatsapp: formData.phone.trim(),
        location: formData.location.trim(),
        category: formData.category,
        title: `Professional ${formData.category} Services`,
        price: parseFloat(formData.price),
        time_frame: formData.time_frame,
        description: formData.description.trim(),
        images: images.length > 0 ? images : null,
        status: "Pending",
        years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : null,
        employee_count: formData.employee_count,
        service_radius_km: parseInt(formData.service_radius_km),
        travel_preference: formData.travel_preference,
        show_prices: formData.show_prices,
        licenses: formData.licenses.length > 0 ? formData.licenses : null,
      }).select().single();

      if (supplierError) throw supplierError;

      // Update pro_account with lead preferences when it's created (after approval)
      // For now, store the preferences - they'll be used when pro_account is created

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
      // Step 1: Account Creation
      case 1:
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
                Sign up to start receiving leads from customers
              </p>
            </div>
            
            <div className="space-y-4">
              <AnimatedField delay={100}>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-12" onClick={() => navigate("/auth?provider=google&returnTo=/become-pro/signup")}>
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                </div>
              </AnimatedField>

              <AnimatedField delay={150}>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>
              </AnimatedField>
              
              <AnimatedField delay={200}>
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

              <AnimatedField delay={250}>
                <div className="group">
                  <Label className="text-base transition-colors group-focus-within:text-primary">Mobile Number *</Label>
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
              
              <AnimatedField delay={350}>
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
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1 animate-fade-in">{errors.password}</p>
                  )}
                </div>
              </AnimatedField>

              <AnimatedField delay={400}>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                    I agree to the <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                  </label>
                </div>
                {errors.terms && (
                  <p className="text-sm text-destructive mt-1 animate-fade-in">{errors.terms}</p>
                )}
              </AnimatedField>
            </div>
          </div>
        );

      // Step 2: Choose Services
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-scale-in">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 animate-fade-in">What do you do?</h2>
              <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
                Select the services you offer to customers
              </p>
            </div>
            
            <AnimatedField delay={150}>
              <div className="group">
                <Label className="text-base transition-colors group-focus-within:text-primary">Service Category *</Label>
                <div className="mt-1.5 transition-transform duration-200 focus-within:scale-[1.01]">
                  <CategoryCombobox
                    value={formData.category}
                    onValueChange={(val) => updateFormData("category", val)}
                    placeholder="Type to search services (e.g., cleaning, plumbing)"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">You can add more services later</p>
                {errors.category && (
                  <p className="text-sm text-destructive mt-1 animate-fade-in">{errors.category}</p>
                )}
              </div>
            </AnimatedField>
          </div>
        );

      // Step 3: Service Area
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-scale-in">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 animate-fade-in">Where do you work?</h2>
              <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
                Set your main location and how far you can travel
              </p>
            </div>
            
            <div className="space-y-4">
              <AnimatedField delay={150}>
                <div className="group">
                  <Label className="text-base transition-colors group-focus-within:text-primary">Main City/Suburb *</Label>
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

              <AnimatedField delay={200}>
                <div className="group">
                  <Label className="text-base">Service Radius (km)</Label>
                  <select
                    className="w-full h-10 mt-1.5 rounded-md border border-input bg-background px-3 text-sm"
                    value={formData.service_radius_km}
                    onChange={(e) => updateFormData("service_radius_km", e.target.value)}
                  >
                    <option value="10">10 km</option>
                    <option value="25">25 km</option>
                    <option value="50">50 km</option>
                    <option value="100">100 km</option>
                    <option value="0">Any distance</option>
                  </select>
                </div>
              </AnimatedField>

              <AnimatedField delay={250}>
                <div className="group">
                  <Label className="text-base mb-3 block">How do you deliver your service?</Label>
                  <RadioGroup 
                    value={formData.travel_preference} 
                    onValueChange={(val) => updateFormData("travel_preference", val)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="to_customer" id="to_customer" />
                      <Label htmlFor="to_customer" className="flex-1 cursor-pointer">I travel to the customer</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="customer_comes" id="customer_comes" />
                      <Label htmlFor="customer_comes" className="flex-1 cursor-pointer">Customer comes to me</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="online_only" id="online_only" />
                      <Label htmlFor="online_only" className="flex-1 cursor-pointer">Online/Remote only</Label>
                    </div>
                  </RadioGroup>
                </div>
              </AnimatedField>
            </div>
          </div>
        );

      // Step 4: Business Profile
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-scale-in">
                <span className="text-2xl">🏢</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 animate-fade-in">Tell customers about your business</h2>
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

              <AnimatedField delay={200}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <Label className="text-base">Years in Business</Label>
                    <Input
                      type="number"
                      value={formData.years_in_business}
                      onChange={(e) => updateFormData("years_in_business", e.target.value)}
                      placeholder="e.g., 5"
                      min="0"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="group">
                    <Label className="text-base">Team Size</Label>
                    <select
                      className="w-full h-10 mt-1.5 rounded-md border border-input bg-background px-3 text-sm"
                      value={formData.employee_count}
                      onChange={(e) => updateFormData("employee_count", e.target.value)}
                    >
                      <option value="just_me">Just me</option>
                      <option value="2-5">2-5 employees</option>
                      <option value="6+">6+ employees</option>
                    </select>
                  </div>
                </div>
              </AnimatedField>
              
              <AnimatedField delay={250}>
                <div className="group">
                  <Label className="text-base transition-colors group-focus-within:text-primary">About Your Business *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Describe your services, experience, and what makes you stand out..."
                    rows={5}
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

              <AnimatedField delay={300}>
                <div className="group">
                  <Label className="text-base">Licenses/Certifications (Optional)</Label>
                  <Input
                    placeholder="e.g., Certified Plumber, Licensed Electrician"
                    className="mt-1.5"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        updateFormData("licenses", [...formData.licenses, e.currentTarget.value.trim()]);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Press Enter to add each license</p>
                  {formData.licenses.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.licenses.map((license, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-full">
                          {license}
                          <button onClick={() => updateFormData("licenses", formData.licenses.filter((_, i) => i !== idx))}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </AnimatedField>
            </div>
          </div>
        );

      // Step 5: Work Preferences & Pricing
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-scale-in">
                <span className="text-2xl">💰</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 animate-fade-in">Work preferences & pricing</h2>
              <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
                Set your rates for {formData.category || "your services"}
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
                      className="w-full h-10 mt-1.5 rounded-md border border-input bg-background px-3 text-sm"
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

              <AnimatedField delay={200}>
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Show prices to customers</Label>
                      <p className="text-sm text-muted-foreground">Display your starting price on your profile</p>
                    </div>
                    <Checkbox 
                      checked={formData.show_prices}
                      onCheckedChange={(checked) => updateFormData("show_prices", checked as boolean)}
                    />
                  </div>
                </div>
              </AnimatedField>
            </div>
          </div>
        );

      // Step 6: Photos
      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-scale-in">
                <span className="text-2xl">📸</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 animate-fade-in">Show off your work</h2>
              <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
                Upload a profile photo and 3-10 portfolio photos
              </p>
            </div>
            
            <AnimatedField delay={150}>
              <div>
                <Label className="text-base">Upload Photos (Optional but recommended)</Label>
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
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">Before/after photos, equipment, completed work</p>
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
                          className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AnimatedField>
          </div>
        );

      // Step 7: Lead & Billing Setup
      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-scale-in">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 animate-fade-in">How do you want to get leads?</h2>
              <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
                Choose how you'll receive and respond to customer requests
              </p>
            </div>
            
            <div className="space-y-4">
              <AnimatedField delay={150}>
                <RadioGroup 
                  value={formData.lead_mode} 
                  onValueChange={(val) => updateFormData("lead_mode", val)}
                  className="space-y-3"
                >
                  <div className={cn(
                    "flex items-start space-x-3 p-4 border rounded-lg transition-colors",
                    formData.lead_mode === "automatic" && "border-primary bg-primary/5"
                  )}>
                    <RadioGroupItem value="automatic" id="automatic" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="automatic" className="text-base font-medium cursor-pointer">
                        Automatic Match
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Recommended</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        We automatically send your quote to matching customers. You're charged a lead fee when matched.
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-start space-x-3 p-4 border rounded-lg transition-colors",
                    formData.lead_mode === "manual" && "border-primary bg-primary/5"
                  )}>
                    <RadioGroupItem value="manual" id="manual" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="manual" className="text-base font-medium cursor-pointer">Manual Selection</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Browse leads and choose which ones to unlock. You control every lead you pay for.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </AnimatedField>

              <AnimatedField delay={200}>
                <div className="group">
                  <Label className="text-base">Monthly Lead Budget (Optional)</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-muted-foreground">R</span>
                    <Input
                      type="number"
                      value={formData.monthly_budget_cap}
                      onChange={(e) => updateFormData("monthly_budget_cap", e.target.value)}
                      placeholder="e.g., 500"
                      min="0"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll pause leads when you reach this amount. Leave blank for no limit.
                  </p>
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

          {/* Step indicators - hidden on mobile */}
          <div className="hidden lg:flex justify-between mb-8 overflow-x-auto">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-2 transition-all duration-300 whitespace-nowrap",
                  step.id === currentStep && "text-primary scale-105",
                  step.id < currentStep && "text-muted-foreground",
                  step.id > currentStep && "text-muted-foreground/50"
                )}
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
                  disabled={currentStep === 1 || (currentStep === 2 && existingUser) || loading || isTransitioning}
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
                    {loading ? "Creating account..." : "Continue"}
                    {!loading && <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {loading ? "Activating..." : "Activate Account"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProSignup;

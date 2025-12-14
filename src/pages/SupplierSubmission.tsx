import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Upload, X, Loader2 } from "lucide-react";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUser } from "@/contexts/UserContext";
import { uploadImagesParallel } from "@/lib/uploadImages";

type ListingType = "service" | "event" | "hire";

const SupplierSubmission = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: userLoading } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [checkingSupplier, setCheckingSupplier] = useState(true);
  const [listingType, setListingType] = useState<ListingType>("service");

  const [formData, setFormData] = useState({
    business_name: "",
    whatsapp: "",
    location: "",
    category: "",
    title: "",
    price: "",
    time_frame: "per service",
    description: "",
    // Event-specific fields
    event_duration: "",
    setup_time: "",
    // Hire-specific fields
    rental_period: "",
    deposit_required: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Pre-fill location from profile
    if (profile?.city) {
      setFormData(prev => ({ ...prev, location: profile.city }));
    }
  }, [profile]);

  useEffect(() => {
    const checkExistingSupplier = async () => {
      if (userLoading) return;
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user already has a supplier account
      const { data: existingSupplier } = await supabase
        .from("suppliers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingSupplier) {
        // Redirect to dashboard regardless of status - profiles go live immediately
        navigate("/supplier-dashboard");
        return;
      }

      setCheckingSupplier(false);
    };

    checkExistingSupplier();
  }, [user, userLoading, navigate, toast]);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 10) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 10 images.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Upload all images in parallel for speed
      const uploadedUrls = await uploadImagesParallel(
        Array.from(files),
        "supplier-images"
      );
      setImages([...images, ...uploadedUrls]);
      toast({
        title: "Images uploaded",
        description: `${uploadedUrls.length} image(s) uploaded successfully.`,
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.business_name && listingType;
      case 2:
        return formData.category && formData.title && formData.location;
      case 3:
        return formData.price;
      case 4:
        return formData.description;
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSubmitting(true);

    try {
      // Build time_frame based on listing type
      let timeFrame = formData.time_frame;
      if (listingType === "hire" && formData.rental_period) {
        timeFrame = `per ${formData.rental_period}`;
      }

      const { error } = await supabase.from("suppliers").insert({
        user_id: user.id,
        business_name: formData.business_name,
        contact_name: profile.full_name,
        phone: profile.phone,
        whatsapp: formData.whatsapp || profile.phone,
        location: formData.location,
        category: formData.category,
        title: formData.title,
        price: parseFloat(formData.price),
        time_frame: timeFrame,
        description: formData.description,
        images: images.length > 0 ? images : null,
        status: "Active", // Profile goes live immediately - like Thumbtack
      });

      if (error) throw error;

      toast({
        title: "You're Live!",
        description: "Your profile is now visible to customers. Start receiving leads!",
      });

      navigate("/supplier-dashboard");
    } catch (error) {
      console.error("Error submitting supplier:", error);
      toast({
        title: "Error",
        description: "Failed to submit your listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getListingTypeLabel = () => {
    switch (listingType) {
      case "service": return "Service";
      case "event": return "Event Service";
      case "hire": return "Item for Hire";
      default: return "Listing";
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Business Information</h3>
              {profile && (
                <p className="text-sm text-muted-foreground mb-4">
                  Listing as: <span className="font-medium text-foreground">{profile.full_name}</span> • {profile.phone}
                </p>
              )}
            </div>
            
            <div>
              <Label className="text-base font-medium mb-3 block">What type of listing is this? *</Label>
              <RadioGroup
                value={listingType}
                onValueChange={(value) => setListingType(value as ListingType)}
                className="grid grid-cols-1 gap-3"
              >
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="service" id="service" className="mt-1" />
                  <Label htmlFor="service" className="cursor-pointer flex-1">
                    <span className="font-medium">Service</span>
                    <p className="text-sm text-muted-foreground">
                      Ongoing services like cleaning, repairs, tutoring, etc.
                    </p>
                  </Label>
                </div>
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="event" id="event" className="mt-1" />
                  <Label htmlFor="event" className="cursor-pointer flex-1">
                    <span className="font-medium">Event Service</span>
                    <p className="text-sm text-muted-foreground">
                      Services for events like DJs, catering, photography, décor, etc.
                    </p>
                  </Label>
                </div>
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="hire" id="hire" className="mt-1" />
                  <Label htmlFor="hire" className="cursor-pointer flex-1">
                    <span className="font-medium">Item for Hire</span>
                    <p className="text-sm text-muted-foreground">
                      Equipment or items for rent like jumping castles, tents, tools, etc.
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                required
                placeholder="Your business or trading name"
                value={formData.business_name}
                onChange={(e) =>
                  setFormData({ ...formData, business_name: e.target.value })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="whatsapp">WhatsApp Number (optional)</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="Leave blank to use your registered phone"
                value={formData.whatsapp}
                onChange={(e) =>
                  setFormData({ ...formData, whatsapp: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                If different from your registered number
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">{getListingTypeLabel()} Details</h3>
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <CategoryCombobox
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                placeholder="Search or select a category..."
              />
            </div>
            <div>
              <Label htmlFor="title">
                {listingType === "hire" ? "Item Name" : "Service Title"} *
              </Label>
              <Input
                id="title"
                required
                placeholder={
                  listingType === "hire" 
                    ? "e.g., Large Jumping Castle, Party Tent 6x6m"
                    : listingType === "event"
                    ? "e.g., Wedding DJ Services, Corporate Catering"
                    : "e.g., Professional House Cleaning, Plumbing Repairs"
                }
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="location">Location/Area *</Label>
              <Input
                id="location"
                required
                placeholder="e.g., Johannesburg, Cape Town"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            {/* Event-specific fields */}
            {listingType === "event" && (
              <>
                <div>
                  <Label htmlFor="event_duration">Typical Duration</Label>
                  <Input
                    id="event_duration"
                    placeholder="e.g., 4-6 hours, Full day"
                    value={formData.event_duration}
                    onChange={(e) =>
                      setFormData({ ...formData, event_duration: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="setup_time">Setup Time Required</Label>
                  <Input
                    id="setup_time"
                    placeholder="e.g., 1 hour before event"
                    value={formData.setup_time}
                    onChange={(e) =>
                      setFormData({ ...formData, setup_time: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {/* Hire-specific fields */}
            {listingType === "hire" && (
              <div>
                <Label htmlFor="rental_period">Rental Period</Label>
                <select
                  id="rental_period"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                  value={formData.rental_period}
                  onChange={(e) =>
                    setFormData({ ...formData, rental_period: e.target.value })
                  }
                >
                  <option value="">Select rental period</option>
                  <option value="hour">Per Hour</option>
                  <option value="day">Per Day</option>
                  <option value="weekend">Per Weekend</option>
                  <option value="week">Per Week</option>
                </select>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Pricing</h3>
            </div>
            <div>
              <Label htmlFor="price">
                {listingType === "hire" ? "Rental Price" : "Your Price"} (R) *
              </Label>
              <Input
                id="price"
                type="number"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder={listingType === "hire" ? "e.g., 800" : "e.g., 500"}
              />
              {listingType === "hire" && formData.rental_period && (
                <p className="text-sm text-muted-foreground mt-1">
                  Price per {formData.rental_period}
                </p>
              )}
            </div>

            {listingType === "hire" && (
              <div>
                <Label htmlFor="deposit_required">Deposit Required (R)</Label>
                <Input
                  id="deposit_required"
                  type="number"
                  placeholder="e.g., 500"
                  value={formData.deposit_required}
                  onChange={(e) =>
                    setFormData({ ...formData, deposit_required: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Refundable deposit for item security
                </p>
              </div>
            )}

            {listingType === "service" && (
              <div>
                <Label htmlFor="time_frame">Pricing Basis</Label>
                <select
                  id="time_frame"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                  value={formData.time_frame}
                  onChange={(e) =>
                    setFormData({ ...formData, time_frame: e.target.value })
                  }
                >
                  <option value="per service">Per Service</option>
                  <option value="per hour">Per Hour</option>
                  <option value="per day">Per Day</option>
                  <option value="per session">Per Session</option>
                </select>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Description & Images</h3>
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                required
                rows={4}
                placeholder={
                  listingType === "hire"
                    ? "Describe your item, condition, what's included, delivery options..."
                    : listingType === "event"
                    ? "Describe your service, packages available, what's included, experience..."
                    : "Describe your service, what makes it special, and what's included..."
                }
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Images (Up to 10)</Label>
              <div className="mt-2">
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-md cursor-pointer hover:border-primary transition-colors"
                >
                  {uploading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="w-8 h-8" />
                      <span className="text-sm">Click to upload images</span>
                      <span className="text-xs">PNG, JPG up to 10 images</span>
                    </div>
                  )}
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading || images.length >= 10}
                />
              </div>
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (userLoading || checkingSupplier) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1 max-w-2xl">
        <Button variant="outline" onClick={() => navigate("/")} className="mb-6">
          ← Back to Home
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">List Your {getListingTypeLabel()}</CardTitle>
            <p className="text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </p>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {renderStep()}

              <div className="flex gap-4 pt-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Back
                  </Button>
                )}
                
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex-1"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitting || !canProceed()}
                    className="flex-1"
                  >
                    {submitting ? "Submitting..." : "Submit Listing"}
                  </Button>
                )}
              </div>

              {currentStep === totalSteps && (
                <p className="text-sm text-muted-foreground text-center">
                  After submission, our team will review your listing and contact you within 24 hours.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default SupplierSubmission;

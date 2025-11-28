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
import { CATEGORY_NAMES } from "@/config/categories";

const SupplierSubmission = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    phone: "",
    whatsapp: "",
    location: "",
    category: "",
    title: "",
    price: "",
    description: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Check if user already has a supplier account
    const { data: existingSupplier } = await supabase
      .from("suppliers")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (existingSupplier) {
      if (existingSupplier.status === "Active") {
        navigate("/supplier-dashboard");
      } else {
        toast({
          title: "Application Pending",
          description: "Your service listing is under review. We'll notify you once it's approved.",
        });
        navigate("/my-account");
      }
      return;
    }

    setLoading(false);
  };

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
        return formData.business_name && formData.contact_name && formData.phone;
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
    if (!user) return;

    setSubmitting(true);

    try {
      const { error } = await supabase.from("suppliers").insert({
        user_id: user.id,
        business_name: formData.business_name,
        contact_name: formData.contact_name,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        location: formData.location,
        category: formData.category,
        title: formData.title,
        price: parseFloat(formData.price),
        description: formData.description,
        images: images.length > 0 ? images : null,
        status: "Pending",
      });

      if (error) throw error;

      toast({
        title: "Service Listed!",
        description: "Your listing is under review. We'll notify you once it's approved and your supplier account is activated.",
      });

      navigate("/my-account");
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Business Information</h3>
            </div>
            <div>
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                required
                value={formData.business_name}
                onChange={(e) =>
                  setFormData({ ...formData, business_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="contact_name">Contact Person *</Label>
              <Input
                id="contact_name"
                required
                value={formData.contact_name}
                onChange={(e) =>
                  setFormData({ ...formData, contact_name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Service Details</h3>
            </div>
            <div>
              <Label htmlFor="category">Service Category *</Label>
              <select
                id="category"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="">Select a category</option>
                {CATEGORY_NAMES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="title">Service Title *</Label>
              <Input
                id="title"
                required
                placeholder="e.g., Premium Jumping Castle Rental"
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Pricing</h3>
            </div>
            <div>
              <Label htmlFor="price">Your Price (R) *</Label>
              <Input
                id="price"
                type="number"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="e.g., 500"
              />
            </div>
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
                placeholder="Describe your service, what makes it special, and what's included..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Service Images (Up to 10)</Label>
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
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
            <CardTitle className="text-2xl">List Your Service</CardTitle>
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

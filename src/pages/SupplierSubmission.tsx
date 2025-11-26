import { useState } from "react";
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

const categories = [
  "Jumping Castles", "Makeup", "Event Décor", "Grass Cutting", 
  "Cleaning", "Tents", "DJ", "Catering", "Photography", "Handyman"
];

const SupplierSubmission = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    phone: "",
    whatsapp: "",
    location: "",
    category: "",
    title: "",
    min_price: "",
    max_price: "",
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("suppliers").insert({
        business_name: formData.business_name,
        contact_name: formData.contact_name,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        location: formData.location,
        category: formData.category,
        title: formData.title,
        min_price: parseFloat(formData.min_price),
        max_price: parseFloat(formData.max_price),
        description: formData.description,
        status: "Pending",
      });

      if (error) throw error;

      toast({
        title: "Submission Successful!",
        description: "We'll review your listing and get back to you soon.",
      });

      navigate("/");
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
              Join our marketplace and connect with customers across South Africa
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  {categories.map((cat) => (
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_price">Minimum Price (R) *</Label>
                  <Input
                    id="min_price"
                    type="number"
                    required
                    value={formData.min_price}
                    onChange={(e) =>
                      setFormData({ ...formData, min_price: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="max_price">Maximum Price (R) *</Label>
                  <Input
                    id="max_price"
                    type="number"
                    required
                    value={formData.max_price}
                    onChange={(e) =>
                      setFormData({ ...formData, max_price: e.target.value })
                    }
                  />
                </div>
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

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Listing"}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                After submission, our team will review your listing and contact you within 24 hours.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default SupplierSubmission;

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

interface ServiceOption {
  id: string;
  title: string;
  supplier_id: string;
}

const BookingForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const selectedIds = location.state?.selectedIds || [];

  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    event_date: "",
    event_time: "",
    event_type: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please login to access booking",
        });
        navigate("/auth", { state: { returnTo: "/booking", selectedIds } });
        return;
      }

      // Load service options to show supplier info
      if (selectedIds.length > 0) {
        const { data, error } = await supabase
          .from("service_options")
          .select("id, title, supplier_id")
          .in("id", selectedIds);

        if (!error && data) {
          setServiceOptions(data);
        }
      }
    };
    checkAuth();
  }, [navigate, selectedIds, toast]);

  if (selectedIds.length === 0) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      // In a real app, integrate payment here first
      // For MVP, we'll just create the booking
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          customer_name: formData.customer_name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          event_date: formData.event_date,
          event_time: formData.event_time,
          event_type: formData.event_type,
          notes: formData.notes,
          selected_option_ids: selectedIds,
          booking_fee_paid: true, // Set to true after payment
          status: "New",
          user_id: session?.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your booking has been submitted",
      });

      navigate("/booking-confirmation", { state: { bookingId: data.id } });
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
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
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          ← Back
        </Button>

        {serviceOptions.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Selected Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {serviceOptions.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                    <span>{service.title}</span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate(`/supplier/${service.supplier_id}`)}
                    >
                      View Supplier Profile
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="customer_name">Full Name *</Label>
                <Input
                  id="customer_name"
                  required
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                />
              </div>

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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="address">Event Address *</Label>
                <Input
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event_date">Event Date *</Label>
                  <Input
                    id="event_date"
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) =>
                      setFormData({ ...formData, event_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="event_time">Event Time</Label>
                  <Input
                    id="event_time"
                    type="time"
                    value={formData.event_time}
                    onChange={(e) =>
                      setFormData({ ...formData, event_time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="event_type">Event Type</Label>
                <Input
                  id="event_type"
                  placeholder="e.g., Birthday Party, Wedding"
                  value={formData.event_type}
                  onChange={(e) =>
                    setFormData({ ...formData, event_type: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Any special requirements or details..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <Card className="bg-primary/5">
                <CardContent className="py-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-foreground">Booking Fee</span>
                    <span className="text-2xl font-bold text-primary">R50</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This fee allows us to secure availability and match you to the best supplier from your selected options.
                  </p>
                </CardContent>
              </Card>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "Processing..." : "Proceed to Secure Booking"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default BookingForm;

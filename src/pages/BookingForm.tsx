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
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ServiceOption {
  id: string;
  title: string;
  supplier_id: string;
}

interface UserProfile {
  full_name: string;
  phone: string;
  address: string;
  city: string;
}

const BookingForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const selectedIds = location.state?.selectedIds || [];

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [profileNeedsUpdate, setProfileNeedsUpdate] = useState(false);
  const [tempProfileData, setTempProfileData] = useState({
    phone: "",
    address: "",
    city: "",
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    event_address: "",
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

      // Check if user is a supplier trying to book their own services
      if (selectedIds.length > 0) {
        const { data: supplierData } = await supabase
          .from("suppliers")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (supplierData) {
          const { data: serviceData } = await supabase
            .from("service_options")
            .select("id")
            .eq("supplier_id", supplierData.id)
            .in("id", selectedIds);

          if (serviceData && serviceData.length > 0) {
            toast({
              title: "Not Allowed",
              description: "Suppliers cannot book their own services",
              variant: "destructive",
            });
            navigate("/");
            return;
          }
        }
      }

      // Load user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile) {
        setUserProfile(profile);
        // Pre-fill event address with user's profile address
        setFormData(prev => ({ ...prev, event_address: profile.address }));
        
        // Check if profile is complete
        if (!profile.phone || !profile.address || !profile.city) {
          setProfileNeedsUpdate(true);
          setCurrentStep(0); // Start at profile completion step
          setTempProfileData({
            phone: profile.phone || "",
            address: profile.address || "",
            city: profile.city || "",
          });
        }
      } else {
        // No profile exists, use metadata as fallback
        const metadata = session.user.user_metadata;
        const profileData = {
          full_name: metadata?.full_name || "",
          phone: metadata?.phone || "",
          address: metadata?.address || "",
          city: metadata?.city || "",
        };
        setUserProfile(profileData);
        
        // Pre-fill event address if available
        if (profileData.address) {
          setFormData(prev => ({ ...prev, event_address: profileData.address }));
        }
        
        // If any data is missing, show profile completion
        if (!profileData.phone || !profileData.address || !profileData.city) {
          setProfileNeedsUpdate(true);
          setCurrentStep(0);
          setTempProfileData({
            phone: profileData.phone,
            address: profileData.address,
            city: profileData.city,
          });
        }
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

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > (profileNeedsUpdate ? 0 : 1)) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: session.user.id,
          full_name: userProfile?.full_name || "",
          phone: tempProfileData.phone,
          address: tempProfileData.address,
          city: tempProfileData.city,
        });

      if (error) throw error;

      setUserProfile({
        ...userProfile!,
        phone: tempProfileData.phone,
        address: tempProfileData.address,
        city: tempProfileData.city,
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved",
      });

      setProfileNeedsUpdate(false);
      setCurrentStep(1);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    }
  };

  const handlePaystackPayment = async () => {
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || "";

      if (!email) {
        toast({
          title: "Error",
          description: "Email is required for payment",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const reference = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Initialize payment via edge function
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-paystack-payment',
        {
          body: {
            email,
            amount: 50, // R50
            reference,
          },
        }
      );

      if (paymentError || !paymentData) {
        throw new Error(paymentError?.message || "Failed to initialize payment");
      }

      // Store booking data in sessionStorage for after redirect
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        customer_name: userProfile?.full_name || "",
        phone: userProfile?.phone || "",
        email: email,
        address: formData.event_address,
        event_date: formData.event_date,
        event_time: formData.event_time || null,
        event_type: formData.event_type,
        notes: formData.notes,
        selected_option_ids: selectedIds,
        payment_reference: reference,
        user_id: session?.user?.id || null,
      }));

      // Redirect to Paystack payment page
      window.location.href = paymentData.authorization_url;
    } catch (error) {
      console.error("Error initializing payment:", error);
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1 max-w-2xl">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          ← Back
        </Button>

        {/* Progress Bar */}
        {currentStep > 0 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        <div>
          {/* Step 0: Complete Profile */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Please complete your profile information to continue with your booking.
                </p>

                <div>
                  <Label htmlFor="profile_phone">Phone Number *</Label>
                  <Input
                    id="profile_phone"
                    type="tel"
                    required
                    placeholder="+27 12 345 6789"
                    value={tempProfileData.phone}
                    onChange={(e) =>
                      setTempProfileData({ ...tempProfileData, phone: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="profile_address">Street Address *</Label>
                  <Input
                    id="profile_address"
                    type="text"
                    required
                    placeholder="123 Main Street"
                    value={tempProfileData.address}
                    onChange={(e) =>
                      setTempProfileData({ ...tempProfileData, address: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="profile_city">City *</Label>
                  <Input
                    id="profile_city"
                    type="text"
                    required
                    placeholder="Johannesburg"
                    value={tempProfileData.city}
                    onChange={(e) =>
                      setTempProfileData({ ...tempProfileData, city: e.target.value })
                    }
                  />
                </div>

                <Button type="button" onClick={handleSaveProfile} className="w-full" size="lg">
                  Save & Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Review Services */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {serviceOptions.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <span className="font-medium">{service.title}</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => navigate(`/supplier/${service.supplier_id}`)}
                    >
                      View Supplier Profile
                    </Button>
                  </div>
                ))}
                <div className="pt-4">
                  <Button type="button" onClick={handleNext} className="w-full" size="lg">
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Event Details */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="event_address">Event Address *</Label>
                  <Input
                    id="event_address"
                    required
                    placeholder="Where will the event take place?"
                    value={formData.event_address}
                    onChange={(e) =>
                      setFormData({ ...formData, event_address: e.target.value })
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
                    placeholder="e.g., Birthday Party, Wedding, Corporate Event"
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

                <div className="flex gap-3">
                  <Button type="button" onClick={handlePrevious} variant="outline" className="flex-1">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button type="button" onClick={handleNext} className="flex-1">
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review & Confirm */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Your Booking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="font-semibold mb-3">Your Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {userProfile?.full_name}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {userProfile?.phone}</p>
                    <p><span className="text-muted-foreground">City:</span> {userProfile?.city}</p>
                  </div>
                </div>

                {/* Event Information */}
                <div>
                  <h3 className="font-semibold mb-3">Event Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Address:</span> {formData.event_address}</p>
                    <p><span className="text-muted-foreground">Date:</span> {formData.event_date}</p>
                    {formData.event_time && (
                      <p><span className="text-muted-foreground">Time:</span> {formData.event_time}</p>
                    )}
                    {formData.event_type && (
                      <p><span className="text-muted-foreground">Type:</span> {formData.event_type}</p>
                    )}
                  </div>
                </div>

                {/* Selected Services */}
                <div>
                  <h3 className="font-semibold mb-3">Selected Services</h3>
                  <div className="space-y-2">
                    {serviceOptions.map((service) => (
                      <div key={service.id} className="p-3 bg-muted/30 rounded text-sm">
                        {service.title}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Booking Fee */}
                <Card className="bg-primary/5 border-primary/20">
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

                <div className="flex gap-3 mb-4">
                  <Button type="button" onClick={handlePrevious} variant="outline" className="flex-1">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                </div>

                {/* Confirm Booking with Payment */}
                <div className="space-y-4">
                  <p className="text-sm text-center text-muted-foreground">
                    Clicking below will open Paystack to complete your R50 booking fee payment
                  </p>
                  <Button 
                    type="button" 
                    onClick={handlePaystackPayment}
                    disabled={submitting}
                    className="w-full" 
                    size="lg"
                  >
                    {submitting ? "Processing..." : "Confirm Booking with booking fee"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookingForm;
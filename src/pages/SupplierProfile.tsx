import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Star, MapPin, Phone, MessageCircle, ArrowLeft, CheckCircle, Clock, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SupplierProfile {
  id: string;
  business_name: string;
  contact_name: string;
  title: string;
  description: string;
  category: string;
  location: string;
  phone: string;
  whatsapp: string;
  images: string[];
  price: number;
  time_frame: string;
}

interface ServiceOption {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  time_frame: string;
  location_area: string;
}

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const SupplierProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);

  useEffect(() => {
    loadSupplierData();
  }, [id]);

  const loadSupplierData = async () => {
    try {
      const { data: supplierData, error: supplierError } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .eq("status", "Active")
        .single();

      if (supplierError) throw supplierError;
      setSupplier(supplierData);

      const { data: optionsData, error: optionsError } = await supabase
        .from("service_options")
        .select("*")
        .eq("supplier_id", id)
        .eq("is_active", true);

      if (optionsError) throw optionsError;
      setServiceOptions(optionsData || []);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("supplier_id", id)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      if (reviewsData && reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
        setAverageRating(avg);
      }

      const { count } = await supabase
        .from("bookings")
        .select("*", { count: 'exact', head: true })
        .eq("matched_supplier_id", id)
        .eq("status", "Completed");
      
      setCompletedJobs(count || 0);
    } catch (error) {
      console.error("Error loading supplier data:", error);
      toast({
        title: "Error",
        description: "Failed to load supplier profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = async (serviceId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please login to book this service",
      });
      navigate("/auth", { state: { returnTo: "/booking", selectedIds: [serviceId] } });
      return;
    }

    navigate("/booking", { state: { selectedIds: [serviceId] } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Supplier not found</p>
              <Button onClick={() => navigate("/browse")}>Browse Services</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const profileImage = supplier.images?.[0] || "/placeholder.svg";
  const initials = supplier.business_name.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6 flex-1 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Hero Section - TaskRabbit Style */}
        <Card className="mb-6 border-border shadow-md">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Profile Image & Quick Info */}
              <div className="flex flex-col items-center md:items-start">
                <Avatar className="h-32 w-32 border-4 border-primary/10">
                  <AvatarImage src={profileImage} alt={supplier.business_name} />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                {/* Stats Cards */}
                <div className="mt-6 space-y-2 w-full">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span className="font-medium">{completedJobs} jobs completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="font-medium">Quick responder</span>
                  </div>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-accent" />
                      <span className="font-medium">{reviews.length} reviews</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-1">
                      {supplier.business_name}
                    </h1>
                    <p className="text-lg text-muted-foreground">{supplier.title}</p>
                  </div>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-lg">
                      <Star className="h-5 w-5 fill-primary text-primary" />
                      <span className="text-2xl font-bold text-foreground">
                        {averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({reviews.length})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {supplier.category}
                  </Badge>
                </div>

                <Separator className="my-4" />

                {/* About Section */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2 text-foreground">About</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {supplier.description || "No description provided."}
                  </p>
                </div>

                {/* Location & Pricing */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground">{supplier.location || "Location not specified"}</span>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Typical pricing</p>
                    <p className="text-2xl font-bold text-foreground">
                      R{supplier.price} {supplier.time_frame && `/ ${supplier.time_frame.replace('per ', '')}`}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    onClick={async () => {
                      const { data: { session } } = await supabase.auth.getSession();
                      
                      if (!session) {
                        toast({
                          title: "Authentication Required",
                          description: "Please login to view contact details",
                        });
                        navigate("/auth", { state: { returnTo: `/supplier/${id}` } });
                        return;
                      }

                      toast({
                        title: "Book a Service",
                        description: "Select a service below and complete booking to view contact details",
                      });
                    }}
                    className="w-full md:w-auto"
                  >
                    Show Contact Details
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Contact details available after booking confirmation
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Offered */}
        {serviceOptions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Services & Pricing</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceOptions.map((option) => (
                <Card
                  key={option.id}
                  className="cursor-pointer transition-all hover:shadow-lg overflow-hidden"
                  onClick={() => handleServiceSelect(option.id)}
                >
                  {option.images && option.images.length > 0 && (
                    <div className="relative group">
                      <Carousel className="w-full">
                        <CarouselContent>
                          {option.images.map((img, idx) => (
                            <CarouselItem key={idx}>
                              <img
                                src={img}
                                alt={`${option.title} ${idx + 1}`}
                                className="w-full h-80 object-cover"
                              />
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {option.images.length > 1 && (
                          <>
                            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </>
                        )}
                      </Carousel>
                    </div>
                  )}
                  <CardContent className="pt-4 pb-4">
                    <div className="mb-3">
                      <p className="text-lg font-bold text-foreground mb-1">
                        R{option.price}
                        {option.time_frame && (
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            / {option.time_frame.replace('per ', '')}
                          </span>
                        )}
                      </p>
                      <h3 className="font-semibold text-foreground text-base mb-1">{option.title}</h3>
                      {option.location_area && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {option.location_area}
                        </p>
                      )}
                    </div>
                    {option.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {option.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Reviews ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {review.customer_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{review.customer_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-primary text-primary"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-foreground leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default SupplierProfile;

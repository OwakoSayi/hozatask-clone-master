import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, MessageCircle, ArrowLeft } from "lucide-react";
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
  min_price: number;
  max_price: number;
}

interface ServiceOption {
  id: string;
  title: string;
  description: string;
  images: string[];
  price_min: number;
  price_max: number;
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

  useEffect(() => {
    loadSupplierData();
  }, [id]);

  const loadSupplierData = async () => {
    try {
      // Load supplier profile
      const { data: supplierData, error: supplierError } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .eq("status", "Active")
        .single();

      if (supplierError) throw supplierError;
      setSupplier(supplierData);

      // Load service options
      const { data: optionsData, error: optionsError } = await supabase
        .from("service_options")
        .select("*")
        .eq("supplier_id", id)
        .eq("is_active", true);

      if (optionsError) throw optionsError;
      setServiceOptions(optionsData || []);

      // Load reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("supplier_id", id)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // Calculate average rating
      if (reviewsData && reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
        setAverageRating(avg);
      }
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading supplier profile...</p>
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Supplier Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                {supplier.images && supplier.images.length > 0 && (
                  <img
                    src={supplier.images[0]}
                    alt={supplier.business_name}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                )}
                <h1 className="text-3xl font-bold mb-2">{supplier.business_name}</h1>
                <p className="text-xl text-muted-foreground mb-4">{supplier.title}</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="secondary">{supplier.category}</Badge>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{averageRating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({reviews.length} reviews)</span>
                    </div>
                  )}
                </div>

                <p className="text-muted-foreground mb-4">{supplier.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier.phone}</span>
                  </div>
                  {supplier.whatsapp && (
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.whatsapp}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Price Range</p>
                  <p className="text-xl font-semibold">
                    R{supplier.min_price} - R{supplier.max_price}
                  </p>
                </div>
              </div>

              {/* Additional Images */}
              {supplier.images && supplier.images.length > 1 && (
                <div className="grid grid-cols-2 gap-2">
                  {supplier.images.slice(1, 5).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${supplier.business_name} ${index + 2}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Options */}
        {serviceOptions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Available Services</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceOptions.map((option) => (
                <Card
                  key={option.id}
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => handleServiceSelect(option.id)}
                >
                  {option.images && option.images.length > 0 && (
                    <img
                      src={option.images[0]}
                      alt={option.title}
                      className="w-full h-40 object-cover rounded-t-lg"
                    />
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {option.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">
                        R{option.price_min} - R{option.price_max}
                      </span>
                      <Button size="sm">Book Now</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No reviews yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{review.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-muted-foreground">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SupplierProfile;
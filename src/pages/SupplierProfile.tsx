import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { RequestEstimateForm } from "@/components/RequestEstimateForm";
import {
  Star,
  MapPin,
  Phone,
  MessageCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Award,
  Share2,
  Copy,
  Check,
  Users,
  Calendar,
  Briefcase,
} from "lucide-react";
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

const ShareProfileButton = ({ supplierId, businessName }: { supplierId: string; businessName: string }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const profileUrl = `${window.location.origin}/supplier/${supplierId}`;
  const shareText = `Book my services on HozaTask: ${businessName}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${businessName} - HozaTask`,
          text: shareText,
          url: profileUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${profileUrl}`);
      setCopied(true);
      toast({ title: "Link copied!", description: "Profile link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <Button variant="outline" onClick={handleShare} size="sm">
      {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
      Share
    </Button>
  );
};

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
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [activeTab, setActiveTab] = useState("about");

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

      const { data: optionsData } = await supabase
        .from("service_options")
        .select("*")
        .eq("supplier_id", id)
        .eq("is_active", true);

      setServiceOptions(optionsData || []);

      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*")
        .eq("supplier_id", id)
        .order("created_at", { ascending: false });

      setReviews(reviewsData || []);

      if (reviewsData && reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
        setAverageRating(avg);
      }

      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("matched_supplier_id", id)
        .eq("status", "Completed");

      setCompletedJobs(count || 0);
    } catch (error) {
      console.error("Error loading supplier data:", error);
      toast({ title: "Error", description: "Failed to load supplier profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = async (serviceId: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast({ title: "Authentication Required", description: "Please login to book this service" });
      navigate("/auth", { state: { returnTo: "/booking", selectedIds: [serviceId] } });
      return;
    }

    navigate("/booking", { state: { selectedIds: [serviceId] } });
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 4.0) return "Very good";
    if (rating >= 3.5) return "Good";
    return "Fair";
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
              <Award className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign Up to View Details</h2>
              <p className="text-muted-foreground mb-6">Create an account to access full supplier profiles.</p>
              <Button onClick={() => navigate("/auth", { state: { returnTo: `/supplier/${id}` } })} className="w-full">
                Sign Up / Login
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const profileImage = supplier.images?.[0] || "/placeholder.svg";
  const initials = supplier.business_name.substring(0, 2).toUpperCase();
  const allImages = [...(supplier.images || []), ...serviceOptions.flatMap(s => s.images || [])];

  // Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-primary">
              HozaTask
            </button>
            <span className="text-muted-foreground">›</span>
            <button onClick={() => navigate(`/pros?category=${encodeURIComponent(supplier.category)}`)} className="text-muted-foreground hover:text-primary">
              {supplier.category}
            </button>
            <span className="text-muted-foreground">›</span>
            <span className="text-foreground">{supplier.business_name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row gap-6">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
                <AvatarImage src={profileImage} alt={supplier.business_name} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{supplier.business_name}</h1>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-primary font-medium">{getRatingLabel(averageRating)}</span>
                      <span className="font-semibold">{averageRating.toFixed(1)}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= Math.round(averageRating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                      <span className="text-muted-foreground">({reviews.length})</span>
                    </div>
                  )}
                  {completedJobs >= 50 && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      <Award className="h-3 w-3 mr-1" />
                      Top Pro
                    </Badge>
                  )}
                </div>
                <ShareProfileButton supplierId={id!} businessName={supplier.business_name} />
              </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none">
                <TabsTrigger 
                  value="about" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                >
                  About
                </TabsTrigger>
                <TabsTrigger 
                  value="services" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                >
                  Services
                </TabsTrigger>
                {allImages.length > 0 && (
                  <TabsTrigger 
                    value="photos" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                  >
                    Photos
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="reviews" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                >
                  Reviews
                </TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="mt-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-3">About</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {supplier.description || "No description provided."}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Overview</h3>
                    <div className="space-y-3">
                      {completedJobs >= 50 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="h-4 w-4 text-primary" />
                          <span>Current Top Pro</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>Hired {completedJobs} times</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span>Background checked</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{supplier.location || "Location not specified"}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Payment methods</h3>
                    <p className="text-sm text-muted-foreground">
                      This pro accepts payments via Cash, Card, and Bank Transfer.
                    </p>
                    {completedJobs >= 50 && (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Top Pro status</h3>
                        <p className="text-sm text-muted-foreground">
                          Top Pros are among the highest-rated, most popular professionals on HozaTask.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {serviceOptions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Services offered</h3>
                    <div className="flex flex-wrap gap-2">
                      {serviceOptions.map((service) => (
                        <Badge key={service.id} variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1 text-primary" />
                          {service.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services" className="mt-6">
                {serviceOptions.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">No services listed yet.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {serviceOptions.map((option) => (
                      <Card
                        key={option.id}
                        className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                        onClick={() => setSelectedService(option)}
                      >
                        {option.images && option.images.length > 0 && (
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={option.images[0]}
                              alt={option.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-1">{option.title}</h3>
                          <p className="text-lg font-bold text-primary">
                            R{option.price}
                            {option.time_frame && (
                              <span className="text-sm font-normal text-muted-foreground ml-1">
                                / {option.time_frame.replace("per ", "")}
                              </span>
                            )}
                          </p>
                          {option.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                              {option.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="mt-6">
                {allImages.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">No photos available.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {allImages.map((img, idx) => (
                      <div key={idx} className="aspect-square overflow-hidden rounded-lg">
                        <img
                          src={img}
                          alt={`Project ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6 space-y-6">
                {reviews.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                        <span className="text-primary font-medium">{getRatingLabel(averageRating)}</span>
                        <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                      </div>
                      <p className="text-muted-foreground">{reviews.length} reviews</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {ratingDistribution.map((item) => (
                        <div key={item.rating} className="flex items-center gap-2 text-sm">
                          <span className="w-4">{item.rating}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-muted-foreground">{Math.round(item.percentage)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">No reviews yet.</p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-6 last:border-0">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {review.customer_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold">{review.customer_name}</p>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${star <= review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {new Date(review.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            {review.comment && <p className="text-foreground">{review.comment}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Request Estimate Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <RequestEstimateForm
                supplierId={id!}
                supplierName={supplier.business_name}
                supplierPhone={supplier.phone}
                category={supplier.category}
                services={serviceOptions.map(s => ({ id: s.id, title: s.title, price: s.price }))}
              />

              {supplier.price && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Starting from</p>
                    <p className="text-2xl font-bold">
                      R{supplier.price}
                      {supplier.time_frame && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          / {supplier.time_frame.replace("per ", "")}
                        </span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Usually responds within 1 hour</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Available today</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Service Detail Dialog */}
      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedService.title}</DialogTitle>
              </DialogHeader>

              {selectedService.images && selectedService.images.length > 0 && (
                <Carousel className="w-full">
                  <CarouselContent>
                    {selectedService.images.map((img, idx) => (
                      <CarouselItem key={idx}>
                        <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
                          <img src={img} alt={`${selectedService.title} ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {selectedService.images.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </>
                  )}
                </Carousel>
              )}

              <div className="space-y-4">
                <p className="text-2xl font-bold text-primary">
                  R{selectedService.price}
                  {selectedService.time_frame && (
                    <span className="text-base font-normal text-muted-foreground ml-1">
                      / {selectedService.time_frame.replace("per ", "")}
                    </span>
                  )}
                </p>

                {selectedService.location_area && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedService.location_area}</span>
                  </div>
                )}

                {selectedService.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-muted-foreground">{selectedService.description}</p>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    handleServiceSelect(selectedService.id);
                    setSelectedService(null);
                  }}
                >
                  Book This Service
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default SupplierProfile;
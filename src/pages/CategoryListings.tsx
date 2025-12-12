import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeaturedPros } from "@/components/FeaturedPros";
import { Users, Grid3X3 } from "lucide-react";
interface ServiceOption {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  time_frame: string;
  location_area: string;
  is_active: boolean;
  supplier_id: string;
  category: string;
  supplier?: {
    business_name: string;
    contact_name: string;
    images: string[];
  };
}

const getPricingTier = (price: number) => {
  if (price < 500) return { fee: 30, range: "R0-R499" };
  if (price < 1500) return { fee: 50, range: "R500-R1,499" };
  if (price < 4000) return { fee: 80, range: "R1,500-R3,999" };
  if (price < 8000) return { fee: 120, range: "R4,000-R7,999" };
  return { fee: 200, range: "R8,000+" };
};

const CategoryListings = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [options, setOptions] = useState<ServiceOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);

  useEffect(() => {
    loadServiceOptions();

    // Subscribe to realtime updates for service_options
    const channel = supabase
      .channel('service-options-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_options',
          filter: `category=eq.${category}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newOption = payload.new as ServiceOption;
            if (newOption.is_active) {
              setOptions((prev) => {
                const exists = prev.find(opt => opt.id === newOption.id);
                if (exists) {
                  return prev.map(opt => opt.id === newOption.id ? newOption : opt);
                }
                return [...prev, newOption];
              });
            }
          } else if (payload.eventType === 'DELETE') {
            setOptions((prev) => prev.filter(opt => opt.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category]);

  const loadServiceOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("service_options")
        .select(`
          *,
          supplier:suppliers(business_name, contact_name, images)
        `)
        .eq("category", category)
        .eq("is_active", true);

      if (error) throw error;
      setOptions(data || []);
    } catch (error) {
      console.error("Error loading service options:", error);
      toast({
        title: "Error",
        description: "Failed to load service options",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const option = options.find(opt => opt.id === id);
    if (!option) return;

    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      if (selectedIds.length >= 3) {
        toast({
          title: "Maximum Reached",
          description: "You can select up to 3 options only",
        });
        return;
      }

      // Check pricing range compatibility
      if (selectedIds.length > 0) {
        const firstSelected = options.find(opt => opt.id === selectedIds[0]);
        if (firstSelected) {
          const firstTier = getPricingTier(firstSelected.price);
          const currentTier = getPricingTier(option.price);
          
          if (firstTier.fee !== currentTier.fee) {
            toast({
              title: "Pricing Range Mismatch",
              description: `All selected services must be in the same pricing range. First selection is ${firstTier.range} (R${firstTier.fee} booking fee).`,
              variant: "destructive",
            });
            return;
          }
        }
      }

      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleContinue = () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least 1 option",
      });
      return;
    }
    navigate("/booking", { state: { selectedIds } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <Button variant="outline" onClick={() => navigate("/")}>
            ← Back to Categories
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-2 capitalize text-foreground">
          {category?.replace("-", " ")}
        </h1>
        <p className="text-muted-foreground mb-4">
          Find trusted professionals or browse specific services
        </p>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="services" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="pros" className="gap-2">
              <Users className="h-4 w-4" />
              View Pros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pros">
            <FeaturedPros 
              category={category} 
              limit={8} 
              title={`Top ${category?.replace("-", " ")} pros`}
              showViewAll={true}
            />
          </TabsContent>

          <TabsContent value="services">
            <p className="text-muted-foreground mb-6">
              Select 1-3 options that interest you ({selectedIds.length}/3 selected)
            </p>

        {options.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No services available in this category yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {options.map((option) => {
                const tier = getPricingTier(option.price);
                return (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedIds.includes(option.id)
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => setSelectedService(option)}
                  >
                    {option.images && option.images.length > 0 && (
                      <div className="relative">
                        <img
                          src={option.images[0]}
                          alt={option.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        {selectedIds.includes(option.id) && (
                          <Badge className="absolute top-2 right-2 bg-primary">
                            Option {selectedIds.indexOf(option.id) + 1}
                          </Badge>
                        )}
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg mb-2">{option.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={option.supplier?.images?.[0]} />
                          <AvatarFallback>{option.supplier?.business_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{option.supplier?.business_name}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{option.description}</p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">
                          R{option.price}
                        </span>
                        <span className="text-xs text-muted-foreground">{option.time_frame}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{option.location_area}</span>
                        <span>Booking fee: R{tier.fee}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="sticky bottom-0 bg-background border-t border-border py-4">
              <div className="container mx-auto flex justify-between items-center">
                <p className="text-muted-foreground">
                  {selectedIds.length} option{selectedIds.length !== 1 ? "s" : ""} selected
                </p>
                <Button
                  size="lg"
                  onClick={handleContinue}
                  disabled={selectedIds.length === 0}
                >
                  Continue to Booking
                </Button>
              </div>
            </div>
          </>
        )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />

      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="max-w-md w-[95vw] h-auto max-h-[85vh] p-0 overflow-hidden flex flex-col">
          {selectedService && (
            <div className="flex flex-col h-full">
              {/* Compact Image Section */}
              {selectedService.images && selectedService.images.length > 0 && (
                <div className="relative h-32 sm:h-40 w-full flex-shrink-0">
                  <img
                    src={selectedService.images[0]}
                    alt={selectedService.title}
                    className="w-full h-full object-cover"
                  />
                  {selectedIds.includes(selectedService.id) && (
                    <Badge className="absolute top-2 right-2 bg-primary">
                      Option {selectedIds.indexOf(selectedService.id) + 1}
                    </Badge>
                  )}
                </div>
              )}

              {/* Content - Compact for mobile */}
              <div className="flex-1 p-4 space-y-3 overflow-hidden">
                {/* Title & Supplier Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold truncate">{selectedService.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={selectedService.supplier?.images?.[0]} />
                        <AvatarFallback className="text-xs">{selectedService.supplier?.business_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground truncate">{selectedService.supplier?.business_name}</span>
                    </div>
                  </div>
                </div>

                {/* Description - Limited */}
                <p className="text-sm text-muted-foreground line-clamp-2">{selectedService.description}</p>

                {/* Price & Details Grid */}
                <div className="grid grid-cols-2 gap-3 py-2 border-y border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="text-xl font-bold">R{selectedService.price}</p>
                    <p className="text-xs text-muted-foreground">{selectedService.time_frame}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Booking Fee</p>
                    <p className="text-xl font-bold">R{getPricingTier(selectedService.price).fee}</p>
                    <p className="text-xs text-muted-foreground">{selectedService.location_area}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  {selectedIds.includes(selectedService.id) ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={(e) => toggleSelection(selectedService.id, e)}
                    >
                      Remove from Selection
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={(e) => toggleSelection(selectedService.id, e)}
                      disabled={selectedIds.length >= 3}
                    >
                      Add as Option {selectedIds.length + 1}
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-muted-foreground"
                    onClick={() => setSelectedService(null)}
                  >
                    ← Add More Options
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryListings;

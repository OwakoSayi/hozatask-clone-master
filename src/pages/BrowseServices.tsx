import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronRight } from "lucide-react";

interface ServiceOption {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  time_frame: string;
  location_area: string;
  category: string;
  is_active: boolean;
  supplier_id: string;
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

const BrowseServices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [options, setOptions] = useState<ServiceOption[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<ServiceOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationSearch, setLocationSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);

  useEffect(() => {
    loadServiceOptions();
    fetchUserCity();
    
    // Check for category parameter in URL
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setCategoryFilter(categoryParam);
    }

    // Subscribe to realtime updates for service_options
    const channel = supabase
      .channel('all-service-options-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_options',
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
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = options;

    if (categoryFilter !== "all") {
      filtered = filtered.filter(opt => opt.category === categoryFilter);
    }

    if (locationSearch) {
      filtered = filtered.filter(opt => 
        opt.location_area?.toLowerCase().includes(locationSearch.toLowerCase())
      );
    }

    // Sort by user's city if logged in and not searching
    if (userCity && !locationSearch) {
      filtered = filtered.sort((a, b) => {
        const aIsLocal = a.location_area?.toLowerCase().includes(userCity.toLowerCase());
        const bIsLocal = b.location_area?.toLowerCase().includes(userCity.toLowerCase());
        
        if (aIsLocal && !bIsLocal) return -1;
        if (!aIsLocal && bIsLocal) return 1;
        return 0;
      });
    }

    setFilteredOptions(filtered);
  }, [options, categoryFilter, locationSearch, userCity]);

  const fetchUserCity = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("city")
        .eq("id", session.user.id)
        .maybeSingle();
      
      if (profile?.city) {
        setUserCity(profile.city);
      }
    }
  };

  const loadServiceOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("service_options")
        .select(`
          *,
          supplier:suppliers(business_name, contact_name, images)
        `)
        .eq("is_active", true);

      if (error) throw error;
      
      setOptions(data || []);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data?.map(opt => opt.category) || []));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error loading service options:", error);
      toast({
        title: "Error",
        description: "Failed to load services",
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

      // Check category compatibility - always check against all options
      if (selectedIds.length > 0) {
        const firstSelected = options.find(opt => opt.id === selectedIds[0]);
        if (firstSelected && firstSelected.category !== option.category) {
          toast({
            title: "Category Mismatch",
            description: `All selected services must be from the same category (${firstSelected.category}).`,
            variant: "destructive",
          });
          return;
        }
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

  const handleContinue = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least 1 option",
      });
      return;
    }

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please login or sign up to continue with your booking",
      });
      navigate("/auth", { state: { returnTo: "/booking", selectedIds } });
      return;
    }

    navigate("/booking", { state: { selectedIds } });
  };

  const clearFilters = () => {
    setCategoryFilter("all");
    setLocationSearch("");
    setSearchParams({});
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    if (value === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ category: value });
    }
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
      
      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <button 
            onClick={() => navigate("/")}
            className="hover:text-foreground transition-colors"
          >
            Home
          </button>
          {categoryFilter !== "all" && (
            <>
              <ChevronRight size={16} />
              <span className="text-foreground font-medium">{categoryFilter}</span>
            </>
          )}
        </nav>
      </div>
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            Browse All Services
          </h1>
          <p className="text-muted-foreground mb-6">
            Explore all available services and filter by category or location
          </p>

          {/* Filters */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Input
                placeholder="Search by location..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {filteredOptions.length} service{filteredOptions.length !== 1 ? "s" : ""} found • {selectedIds.length}/3 selected
          </p>
        </div>

        {filteredOptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No services match your filters.</p>
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredOptions.map((option) => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all hover:shadow-lg overflow-hidden relative ${
                      isSelected
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => setSelectedService(option)}
                  >
                    {/* Selection Checkbox */}
                    <div 
                      className="absolute top-2 right-2 z-20 bg-background/90 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-background transition-colors"
                      onClick={(e) => toggleSelection(option.id, e)}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="h-5 w-5 pointer-events-none"
                      />
                    </div>
                    
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
                        {isSelected && (
                          <Badge className="absolute top-2 left-2 bg-primary z-10">
                            Option {selectedIds.indexOf(option.id) + 1}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs capitalize z-10">
                          {option.category}
                        </Badge>
                      </div>
                    )}
                    <CardContent className="pt-4 pb-4">
                      <div className="font-bold text-xl mb-1">
                        R{option.price}
                        <span className="text-sm text-muted-foreground font-normal ml-1">
                          {option.time_frame}
                        </span>
                      </div>
                      <h3 className="font-semibold text-base mb-1 line-clamp-2">{option.title}</h3>
                      <p className="text-sm text-muted-foreground">{option.location_area}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedIds.length > 0 && (
              <div className="sticky bottom-0 bg-background border-t border-border py-4">
                <div className="container mx-auto flex justify-between items-center">
                  <p className="text-muted-foreground">
                    {selectedIds.length} option{selectedIds.length !== 1 ? "s" : ""} selected
                  </p>
                  <Button size="lg" onClick={handleContinue}>
                    Continue to Booking
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />

      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          {selectedService && (
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left side - Images */}
              <div className="bg-muted">
                {selectedService.images && selectedService.images.length > 0 && (
                  <Carousel className="w-full h-full">
                    <CarouselContent>
                      {selectedService.images.map((img, idx) => (
                        <CarouselItem key={idx}>
                          <img
                            src={img}
                            alt={`${selectedService.title} ${idx + 1}`}
                            className="w-full h-[90vh] object-cover"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {selectedService.images.length > 1 && (
                      <>
                        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
                        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
                      </>
                    )}
                  </Carousel>
                )}
              </div>

              {/* Right side - Details */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[90vh]">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedService.title}</h2>
                  <Badge variant="secondary" className="capitalize">{selectedService.category}</Badge>
                </div>

                <div className="space-y-1">
                  <div className="text-3xl font-bold">R{selectedService.price}</div>
                  <p className="text-sm text-muted-foreground">{selectedService.time_frame}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedService.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Location</h3>
                  <p className="text-muted-foreground">{selectedService.location_area}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Booking Fee</h3>
                  <p className="text-xl font-bold">R{getPricingTier(selectedService.price).fee}</p>
                  <p className="text-sm text-muted-foreground">{getPricingTier(selectedService.price).range}</p>
                </div>

                <div 
                  className="flex items-center gap-3 p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => navigate(`/supplier/${selectedService.supplier_id}`)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedService.supplier?.images?.[0]} />
                    <AvatarFallback>{selectedService.supplier?.business_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{selectedService.supplier?.business_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedService.supplier?.contact_name}</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </div>

                <div className="pt-4 border-t">
                  {selectedIds.includes(selectedService.id) ? (
                    <Button 
                      variant="destructive" 
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
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseServices;

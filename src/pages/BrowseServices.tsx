import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [options, setOptions] = useState<ServiceOption[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<ServiceOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationSearch, setLocationSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);

  useEffect(() => {
    loadServiceOptions();

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

    setFilteredOptions(filtered);
  }, [options, categoryFilter, locationSearch]);

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
    
    const option = filteredOptions.find(opt => opt.id === id);
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

      // Check category compatibility
      if (selectedIds.length > 0) {
        const firstSelected = filteredOptions.find(opt => opt.id === selectedIds[0]);
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
        const firstSelected = filteredOptions.find(opt => opt.id === selectedIds[0]);
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {option.category}
                        </Badge>
                      </div>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedService.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {selectedService.images && selectedService.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedService.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${selectedService.title} ${idx + 1}`}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedService.supplier?.images?.[0]} />
                    <AvatarFallback>{selectedService.supplier?.business_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedService.supplier?.business_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedService.supplier?.contact_name}</p>
                  </div>
                </div>

                <div>
                  <Badge variant="secondary" className="mb-3 capitalize">{selectedService.category}</Badge>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedService.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">Price</h3>
                    <p className="text-2xl font-bold">R{selectedService.price}</p>
                    <p className="text-sm text-muted-foreground">{selectedService.time_frame}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Booking Fee</h3>
                    <p className="text-2xl font-bold">R{getPricingTier(selectedService.price).fee}</p>
                    <p className="text-sm text-muted-foreground">{getPricingTier(selectedService.price).range}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Location</h3>
                  <p className="text-muted-foreground">{selectedService.location_area}</p>
                </div>

                <div className="flex gap-2">
                  {selectedIds.includes(selectedService.id) ? (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={(e) => toggleSelection(selectedService.id, e)}
                    >
                      Remove from Selection
                    </Button>
                  ) : (
                    <Button 
                      className="flex-1"
                      onClick={(e) => toggleSelection(selectedService.id, e)}
                      disabled={selectedIds.length >= 3}
                    >
                      Add as Option {selectedIds.length + 1}
                    </Button>
                  )}
                  <Button 
                    variant="secondary"
                    onClick={() => navigate(`/supplier/${selectedService.supplier_id}`)}
                  >
                    View Supplier Profile
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseServices;

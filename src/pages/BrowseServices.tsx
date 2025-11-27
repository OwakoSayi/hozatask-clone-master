import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
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
  price_min: number;
  price_max: number;
  location_area: string;
  category: string;
  is_active: boolean;
}

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
        .select("*")
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

  const toggleSelection = (id: string) => {
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
              {filteredOptions.map((option) => (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all ${
                    selectedIds.includes(option.id)
                      ? "ring-2 ring-primary"
                      : "hover:shadow-lg"
                  }`}
                  onClick={() => toggleSelection(option.id)}
                >
                  {option.images && option.images.length > 0 && (
                    <img
                      src={option.images[0]}
                      alt={option.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">{option.title}</CardTitle>
                        <span className="text-xs text-muted-foreground capitalize">
                          {option.category}
                        </span>
                      </div>
                      <Checkbox
                        checked={selectedIds.includes(option.id)}
                        onCheckedChange={() => toggleSelection(option.id)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 text-sm line-clamp-2">
                      {option.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">
                        R{option.price_min} - R{option.price_max}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {option.location_area}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
    </div>
  );
};

export default BrowseServices;

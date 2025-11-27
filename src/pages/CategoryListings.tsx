import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

interface ServiceOption {
  id: string;
  title: string;
  description: string;
  images: string[];
  price_min: number;
  price_max: number;
  location_area: string;
  is_active: boolean;
}

const CategoryListings = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [options, setOptions] = useState<ServiceOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select("*")
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
        <p className="text-muted-foreground mb-8">
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
              {options.map((option) => (
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
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{option.title}</CardTitle>
                      <Checkbox
                        checked={selectedIds.includes(option.id)}
                        onCheckedChange={() => toggleSelection(option.id)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{option.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">
                        R{option.price_min} - R{option.price_max}
                      </span>
                      <span className="text-sm text-muted-foreground">{option.location_area}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
      </div>

      <Footer />
    </div>
  );
};

export default CategoryListings;

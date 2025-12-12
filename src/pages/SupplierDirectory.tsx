import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Search, Users, Navigation, Loader2, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProCard } from "@/components/ProCard";
import { ProSearchAutocomplete } from "@/components/ProSearchAutocomplete";
import { getPopularCategories } from "@/config/categories";
import { useGeolocation, getLocationCoords } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/use-toast";

interface Supplier {
  id: string;
  business_name: string;
  title: string;
  description: string;
  category: string;
  location: string;
  images: string[];
  price: number;
}

interface SupplierWithRating extends Supplier {
  averageRating: number;
  reviewCount: number;
  distance?: number;
}

const SupplierDirectory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [suppliers, setSuppliers] = useState<SupplierWithRating[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<SupplierWithRating[]>([]);
  const [serviceSearch, setServiceSearch] = useState(searchParams.get("category") || "");
  const [locationSearch, setLocationSearch] = useState(searchParams.get("location") || "");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("distance");
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { latitude, longitude, cityName, loading: geoLoading, error: geoError, requestLocation, calculateDistance } = useGeolocation();

  const popularCategories = getPopularCategories();

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const locationParam = searchParams.get("location");
    if (categoryParam) {
      setServiceSearch(categoryParam);
    }
    if (locationParam) {
      setLocationSearch(locationParam);
    }
  }, [searchParams]);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, serviceSearch, locationSearch, categoryFilter, latitude, longitude, sortBy, maxDistance]);

  // Auto-request location on page load if not already available
  useEffect(() => {
    if (!latitude && !longitude && !geoLoading && !geoError) {
      // Request location after a short delay to let page load
      const timer = setTimeout(() => {
        requestLocation();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Set location search to city name when geolocation is detected
  useEffect(() => {
    if (cityName && !locationSearch) {
      setLocationSearch(cityName);
    }
  }, [cityName]);

  const loadSuppliers = async () => {
    try {
      const { data: suppliersData, error: suppliersError } = await supabase
        .from("suppliers")
        .select("*")
        .eq("status", "Active");

      if (suppliersError) throw suppliersError;

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("supplier_id, rating");

      if (reviewsError) throw reviewsError;

      const suppliersWithRatings: SupplierWithRating[] = (suppliersData || []).map((supplier) => {
        const supplierReviews = reviewsData?.filter((r) => r.supplier_id === supplier.id) || [];
        const averageRating = supplierReviews.length > 0
          ? supplierReviews.reduce((sum, r) => sum + r.rating, 0) / supplierReviews.length
          : 0;

        return {
          ...supplier,
          averageRating,
          reviewCount: supplierReviews.length,
        };
      });

      setSuppliers(suppliersWithRatings);

      const uniqueCategories = Array.from(
        new Set(suppliersData?.map((s) => s.category) || [])
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSuppliers = () => {
    let filtered = suppliers.map(supplier => {
      // Calculate distance if user location is available
      let distance: number | undefined;
      
      if (latitude && longitude && supplier.location) {
        const supplierCoords = getLocationCoords(supplier.location);
        if (supplierCoords) {
          distance = calculateDistance(latitude, longitude, supplierCoords.lat, supplierCoords.lon);
        }
      }
      
      return { ...supplier, distance };
    });

    // Filter by service/category search
    if (serviceSearch) {
      const searchLower = serviceSearch.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.business_name.toLowerCase().includes(searchLower) ||
          s.title.toLowerCase().includes(searchLower) ||
          s.category.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by location search
    if (locationSearch) {
      const searchLower = locationSearch.toLowerCase();
      filtered = filtered.filter(
        (s) => s.location?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category dropdown
    if (categoryFilter !== "all") {
      filtered = filtered.filter((s) => s.category === categoryFilter);
    }

    // Filter by max distance if user location is available
    if (latitude && longitude && sortBy === "distance") {
      filtered = filtered.filter(s => s.distance !== undefined && s.distance <= maxDistance);
    }

    // Sort suppliers
    switch (sortBy) {
      case "distance":
        filtered.sort((a, b) => {
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });
        break;
      case "rating":
        filtered.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case "reviews":
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "price-low":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-high":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
    }

    setFilteredSuppliers(filtered);
  };

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (serviceSearch) params.category = serviceSearch;
    if (locationSearch) params.location = locationSearch;
    setSearchParams(params);
    filterSuppliers();
  };

  const handleCategoryClick = (category: string) => {
    setServiceSearch(category);
    setSearchParams({ category });
  };

  const clearFilters = () => {
    setServiceSearch("");
    setLocationSearch("");
    setCategoryFilter("all");
    setSearchParams({});
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Hero Section with Search */}
      <section className="bg-primary/5 py-8 md:py-12 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-4">
            {serviceSearch ? `${serviceSearch} Professionals` : "Find Trusted Professionals Near You"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {latitude && cityName ? (
              <span className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Showing pros near {cityName}
              </span>
            ) : (
              "Browse verified pros ready to help with your project"
            )}
          </p>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <ProSearchAutocomplete
              serviceValue={serviceSearch}
              locationValue={locationSearch}
              onServiceChange={setServiceSearch}
              onLocationChange={setLocationSearch}
              onSearch={handleSearch}
            />
          </div>

          {/* Location Status */}
          {!latitude && !geoLoading && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={requestLocation}
                className="gap-2"
              >
                <Navigation className="h-4 w-4" />
                Enable location to find nearby pros
              </Button>
            </div>
          )}
          {geoLoading && (
            <div className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Getting your location...
            </div>
          )}
        </div>
      </section>

      {/* Popular Categories */}
      {!serviceSearch && (
        <section className="py-4 md:py-6 px-4 border-b">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {popularCategories.slice(0, 8).map((category) => (
                <Button
                  key={category.slug}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs md:text-sm"
                  onClick={() => handleCategoryClick(category.name)}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-6 md:py-8 flex-1">
        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-muted-foreground text-sm">
              {filteredSuppliers.length} professional{filteredSuppliers.length !== 1 ? "s" : ""} found
            </p>
            {(serviceSearch || locationSearch) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                Clear filters
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Nearest</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            {latitude && longitude && (
              <Select value={maxDistance.toString()} onValueChange={(v) => setMaxDistance(parseInt(v))}>
                <SelectTrigger className="w-[120px] h-9 text-sm">
                  <SelectValue placeholder="Distance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Within 10km</SelectItem>
                  <SelectItem value="25">Within 25km</SelectItem>
                  <SelectItem value="50">Within 50km</SelectItem>
                  <SelectItem value="100">Within 100km</SelectItem>
                  <SelectItem value="500">Within 500km</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] h-9 text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No professionals found matching your criteria</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredSuppliers.map((supplier) => (
              <ProCard
                key={supplier.id}
                id={supplier.id}
                businessName={supplier.business_name}
                title={supplier.title}
                description={supplier.description}
                category={supplier.category}
                location={supplier.location}
                images={supplier.images}
                price={supplier.price}
                averageRating={supplier.averageRating}
                reviewCount={supplier.reviewCount}
                distance={supplier.distance}
                onClick={() => navigate(`/supplier/${supplier.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SupplierDirectory;

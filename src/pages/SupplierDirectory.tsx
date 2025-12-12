import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Search, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProCard } from "@/components/ProCard";
import { getPopularCategories, CATEGORY_GROUPS, getCategoriesByGroup } from "@/config/categories";

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
}

const SupplierDirectory = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [suppliers, setSuppliers] = useState<SupplierWithRating[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<SupplierWithRating[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get("category") || "all");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const popularCategories = getPopularCategories();

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setCategoryFilter(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchTerm, categoryFilter]);

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    if (value === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ category: value });
    }
  };

  const loadSuppliers = async () => {
    try {
      // Load all active suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from("suppliers")
        .select("*")
        .eq("status", "Active");

      if (suppliersError) throw suppliersError;

      // Load all reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("supplier_id, rating");

      if (reviewsError) throw reviewsError;

      // Calculate ratings for each supplier
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

      // Extract unique categories
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
    let filtered = suppliers;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((s) => s.category === categoryFilter);
    }

    setFilteredSuppliers(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary/5 py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {categoryFilter !== "all" ? `${categoryFilter} Professionals` : "Find Trusted Professionals"}
          </h1>
          <p className="text-muted-foreground mb-6">
            Browse verified pros ready to help with your project
          </p>
          
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search professionals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="All Categories" />
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
      </section>

      {/* Popular Categories */}
      {categoryFilter === "all" && (
        <section className="py-6 px-4 border-b">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {popularCategories.slice(0, 8).map((category) => (
                <Button
                  key={category.slug}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleCategoryChange(category.name)}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {filteredSuppliers.length} professional{filteredSuppliers.length !== 1 ? "s" : ""} found
          </p>
          {categoryFilter !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => handleCategoryChange("all")}>
              Clear filter
            </Button>
          )}
        </div>

        {filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No professionals found matching your criteria</p>
              <Button variant="outline" onClick={() => { setSearchTerm(""); handleCategoryChange("all"); }}>
                Clear filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
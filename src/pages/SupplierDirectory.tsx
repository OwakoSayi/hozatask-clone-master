import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Supplier {
  id: string;
  business_name: string;
  title: string;
  description: string;
  category: string;
  location: string;
  images: string[];
  min_price: number;
  max_price: number;
}

interface SupplierWithRating extends Supplier {
  averageRating: number;
  reviewCount: number;
}

const SupplierDirectory = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<SupplierWithRating[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<SupplierWithRating[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchTerm, categoryFilter]);

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
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold mb-2">Browse Suppliers</h1>
        <p className="text-muted-foreground mb-6">
          Find the perfect supplier for your needs
        </p>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
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
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? "s" : ""} found
        </p>

        {filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No suppliers found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <Card
                key={supplier.id}
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => navigate(`/supplier/${supplier.id}`)}
              >
                {supplier.images && supplier.images.length > 0 && (
                  <img
                    src={supplier.images[0]}
                    alt={supplier.business_name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-xl">{supplier.business_name}</CardTitle>
                    {supplier.reviewCount > 0 && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-sm">
                          {supplier.averageRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{supplier.title}</p>
                  <Badge variant="secondary" className="w-fit">{supplier.category}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 text-sm line-clamp-2">
                    {supplier.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.location}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">
                        R{supplier.min_price} - R{supplier.max_price}
                      </span>
                      {supplier.reviewCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {supplier.reviewCount} review{supplier.reviewCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SupplierDirectory;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProCard } from "./ProCard";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SupplierWithRating {
  id: string;
  business_name: string;
  title: string;
  description: string;
  category: string;
  location: string;
  images: string[];
  price: number;
  averageRating: number;
  reviewCount: number;
}

interface FeaturedProsProps {
  category?: string;
  limit?: number;
  title?: string;
  showViewAll?: boolean;
}

export const FeaturedPros = ({
  category,
  limit = 4,
  title = "Top-rated pros near you",
  showViewAll = true,
}: FeaturedProsProps) => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<SupplierWithRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuppliers();
  }, [category]);

  const loadSuppliers = async () => {
    try {
      let query = supabase
        .from("suppliers")
        .select("*")
        .eq("status", "Active");

      if (category) {
        query = query.eq("category", category);
      }

      const { data: suppliersData, error: suppliersError } = await query.limit(limit * 2);

      if (suppliersError) throw suppliersError;

      // Load reviews for these suppliers
      const supplierIds = suppliersData?.map((s) => s.id) || [];
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("supplier_id, rating")
        .in("supplier_id", supplierIds);

      // Calculate ratings and sort by rating
      const suppliersWithRatings: SupplierWithRating[] = (suppliersData || [])
        .map((supplier) => {
          const supplierReviews = reviewsData?.filter((r) => r.supplier_id === supplier.id) || [];
          const averageRating =
            supplierReviews.length > 0
              ? supplierReviews.reduce((sum, r) => sum + r.rating, 0) / supplierReviews.length
              : 0;

          return {
            ...supplier,
            averageRating,
            reviewCount: supplierReviews.length,
          };
        })
        .sort((a, b) => {
          // Sort by rating first, then by review count
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          return b.reviewCount - a.reviewCount;
        })
        .slice(0, limit);

      setSuppliers(suppliersWithRatings);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
        {showViewAll && (
          <Button
            variant="link"
            className="text-primary p-0"
            onClick={() =>
              navigate(category ? `/pros?category=${encodeURIComponent(category)}` : "/pros")
            }
          >
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {suppliers.map((supplier) => (
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
    </div>
  );
};

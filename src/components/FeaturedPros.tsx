import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProCard } from "./ProCard";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useEmblaCarousel from "embla-carousel-react";

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
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, [category]);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
    
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

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

      const supplierIds = suppliersData?.map((s) => s.id) || [];
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("supplier_id, rating")
        .in("supplier_id", supplierIds);

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
        {/* Mobile skeleton - horizontal scroll */}
        <div className="md:hidden flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="min-w-[200px] space-y-3">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
        {/* Desktop skeleton - grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-4">
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
        <div className="flex items-center gap-2">
          {/* Mobile carousel controls */}
          <div className="md:hidden flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canScrollPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canScrollNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
      </div>

      {/* Mobile horizontal carousel */}
      <div className="md:hidden overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="min-w-[200px] max-w-[200px] flex-shrink-0">
              <ProCard
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
            </div>
          ))}
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
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
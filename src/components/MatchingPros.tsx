import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Clock, MessageCircle, CheckCircle, Users, Sparkles } from "lucide-react";

interface MatchingPro {
  id: string;
  business_name: string;
  title: string;
  description: string;
  category: string;
  location: string;
  images: string[];
  price: number;
  years_in_business?: number;
  averageRating: number;
  reviewCount: number;
}

interface MatchingProsProps {
  category: string;
  location: string;
  projectId?: string;
}

export const MatchingPros = ({ category, location, projectId }: MatchingProsProps) => {
  const navigate = useNavigate();
  const [pros, setPros] = useState<MatchingPro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadMatchingPros();
  }, [category, location]);

  const loadMatchingPros = async () => {
    try {
      // Get suppliers matching the category
      const { data: suppliersData, error: suppliersError } = await supabase
        .from("suppliers")
        .select("*")
        .eq("status", "Active")
        .eq("category", category)
        .limit(10);

      if (suppliersError) throw suppliersError;

      // Get reviews for rating calculation
      const supplierIds = suppliersData?.map(s => s.id) || [];
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("supplier_id, rating")
        .in("supplier_id", supplierIds);

      const prosWithRatings: MatchingPro[] = (suppliersData || []).map((supplier) => {
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

      // Sort by rating first, then by review count
      prosWithRatings.sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return b.reviewCount - a.reviewCount;
      });

      setPros(prosWithRatings);
    } catch (error) {
      console.error("Error loading matching pros:", error);
    } finally {
      setLoading(false);
    }
  };

  const displayedPros = showAll ? pros : pros.slice(0, 3);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (pros.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No pros found yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We're actively recruiting {category} professionals in your area.
            You'll receive quotes once pros join!
          </p>
          <Button variant="outline" onClick={() => navigate("/my-projects")}>
            View My Projects
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">
          {pros.length} {category} pro{pros.length !== 1 ? "s" : ""} ready to help
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        These pros match your request and can send you quotes
      </p>

      <div className="space-y-3">
        {displayedPros.map((pro, index) => (
          <Card 
            key={pro.id} 
            className="overflow-hidden hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary"
            onClick={() => navigate(`/supplier/${pro.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Pro Image */}
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {pro.images?.[0] ? (
                    <img
                      src={pro.images[0]}
                      alt={pro.business_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Users className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Pro Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                        {pro.business_name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{pro.title}</p>
                    </div>
                    {index === 0 && (
                      <Badge variant="secondary" className="flex-shrink-0 text-xs bg-primary/10 text-primary">
                        Top Match
                      </Badge>
                    )}
                  </div>

                  {/* Rating & Location */}
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    {pro.averageRating > 0 ? (
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{pro.averageRating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({pro.reviewCount})</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">New pro</span>
                    )}
                    {pro.location && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{pro.location}</span>
                      </span>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {pro.years_in_business && pro.years_in_business > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {pro.years_in_business}+ years
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Available
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0 self-center">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <MessageCircle className="h-3.5 w-3.5" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pros.length > 3 && !showAll && (
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={(e) => {
            e.stopPropagation();
            setShowAll(true);
          }}
        >
          Show {pros.length - 3} more pros
        </Button>
      )}

      {showAll && (
        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={() => navigate(`/pros?category=${encodeURIComponent(category)}`)}
        >
          Browse all {category} professionals →
        </Button>
      )}
    </div>
  );
};

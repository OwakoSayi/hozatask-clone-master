import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface ProReviewsSectionProps {
  reviews: Review[];
  averageRating: number;
}

export function ProReviewsSection({ reviews, averageRating }: ProReviewsSectionProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Customer Reviews</CardTitle>
            <CardDescription>See what your clients say</CardDescription>
          </div>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-semibold">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({reviews.length})</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No reviews yet</p>
            <p className="text-sm text-muted-foreground">
              Complete jobs to start receiving reviews from customers
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {review.customer_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                        <p className="font-semibold">{review.customer_name}</p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                      {review.comment && (
                        <p className="text-sm mt-2">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

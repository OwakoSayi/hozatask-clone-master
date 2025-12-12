import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProCardProps {
  id: string;
  businessName: string;
  title: string;
  description?: string;
  category: string;
  location: string;
  images: string[];
  price?: number;
  averageRating: number;
  reviewCount: number;
  onClick?: () => void;
  compact?: boolean;
}

export const ProCard = ({
  businessName,
  title,
  description,
  category,
  location,
  images,
  price,
  averageRating,
  reviewCount,
  onClick,
  compact = false,
}: ProCardProps) => {
  if (compact) {
    return (
      <Card
        className="cursor-pointer hover:shadow-lg transition-all group"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 rounded-lg">
              <AvatarImage src={images?.[0]} className="object-cover" />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                {businessName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                {businessName}
              </h3>
              <p className="text-sm text-muted-foreground truncate">{title}</p>
              <div className="flex items-center gap-2 mt-1">
                {reviewCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({reviewCount})
                    </span>
                  </div>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all overflow-hidden group"
      onClick={onClick}
    >
      {images && images.length > 0 && (
        <div className="relative h-28 sm:h-40 overflow-hidden">
          <img
            src={images[0]}
            alt={businessName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
            {category}
          </Badge>
        </div>
      )}
      <CardContent className="p-2 sm:p-4">
        <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
              {businessName}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
          </div>
          {reviewCount > 0 && (
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-xs sm:text-sm">
                {averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        
        {description && (
          <p className="hidden sm:block text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground flex items-center gap-0.5 sm:gap-1 truncate">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">{location}</span>
          </span>
          {price && (
            <span className="font-semibold shrink-0 ml-1">R{price}</span>
          )}
        </div>
        
        {reviewCount > 0 && (
          <div className="hidden sm:flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-primary" />
            {reviewCount} review{reviewCount !== 1 ? "s" : ""}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

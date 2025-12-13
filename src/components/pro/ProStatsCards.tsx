import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, TrendingUp, Star, Briefcase, Zap } from "lucide-react";

interface ProStatsCardsProps {
  completed: number;
  pending: number;
  rating: number;
  activeServices: number;
  credits: number;
}

export function ProStatsCards({
  completed,
  pending,
  rating,
  activeServices,
  credits,
}: ProStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-accent" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pending}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Rating</p>
              <p className="text-2xl font-bold">{rating > 0 ? rating.toFixed(1) : "N/A"}</p>
            </div>
            <Star className="h-8 w-8 text-primary fill-primary" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Services</p>
              <p className="text-2xl font-bold">{activeServices}</p>
            </div>
            <Briefcase className="h-8 w-8 text-accent" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Credits</p>
              <p className="text-2xl font-bold">{credits}</p>
            </div>
            <Zap className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

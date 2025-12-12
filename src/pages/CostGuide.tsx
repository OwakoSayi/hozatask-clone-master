import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DollarSign, Clock, Lightbulb, ArrowRight, TrendingUp } from "lucide-react";

interface CostGuideData {
  id: string;
  category: string;
  avg_price_min: number;
  avg_price_max: number;
  typical_duration: string;
  description: string;
  tips: string[];
  price_factors: any;
}

const CostGuide = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState<CostGuideData | null>(null);
  const [allGuides, setAllGuides] = useState<CostGuideData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [category]);

  const loadData = async () => {
    try {
      if (category) {
        const { data } = await supabase
          .from("cost_guides")
          .select("*")
          .eq("category", decodeURIComponent(category))
          .maybeSingle();

        setGuide(data);
      }

      const { data: allData } = await supabase
        .from("cost_guides")
        .select("*")
        .order("category", { ascending: true });

      setAllGuides(allData || []);
    } catch (error) {
      console.error("Error loading cost guide:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (category && guide) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
          <Button variant="ghost" onClick={() => navigate("/cost-guides")} className="mb-6">
            ← All Cost Guides
          </Button>

          <div className="mb-8">
            <Badge variant="secondary" className="mb-2">{guide.category}</Badge>
            <h1 className="text-3xl font-bold mb-2">
              How Much Does {guide.category} Cost?
            </h1>
            <p className="text-muted-foreground">{guide.description}</p>
          </div>

          {/* Price Range */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Price Range</p>
                  <p className="text-3xl font-bold text-primary">
                    R{guide.avg_price_min} - R{guide.avg_price_max}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Typical duration: {guide.typical_duration}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          {guide.tips && guide.tips.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Tips for Hiring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {guide.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* CTA */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    Ready to get started?
                  </h3>
                  <p className="text-muted-foreground">
                    Post your project and get free quotes from top pros
                  </p>
                </div>
                <Button onClick={() => navigate(`/post-project?category=${encodeURIComponent(guide.category)}`)}>
                  Get Quotes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    );
  }

  // List all cost guides
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Cost Guides</h1>
            <p className="text-muted-foreground">
              See what others are paying for home services in your area
            </p>
          </div>

          {allGuides.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No cost guides yet</h3>
                <p className="text-muted-foreground">
                  Cost guides will be added as more pros join the platform
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {allGuides.map((g) => (
                <Card 
                  key={g.id} 
                  className="cursor-pointer hover:border-primary/50 transition"
                  onClick={() => navigate(`/cost-guides/${encodeURIComponent(g.category)}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{g.category}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {g.description}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">
                        R{g.avg_price_min} - R{g.avg_price_max}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {g.typical_duration}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CostGuide;

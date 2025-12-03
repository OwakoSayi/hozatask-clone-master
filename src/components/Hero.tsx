import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, TreePine } from "lucide-react";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-primary py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary-foreground/20 p-3 rounded-lg">
              <TreePine className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <p className="text-primary-foreground/80 text-sm">Seasonal</p>
              <p className="text-primary-foreground/80 text-sm">PROMO</p>
            </div>
          </div>
          
          <h1 className="text-3xl lg:text-5xl font-bold text-primary-foreground leading-tight mb-6">
            Book trusted help for event & home services instantly
          </h1>
          
          <p className="text-lg text-primary-foreground/90 leading-relaxed mb-8">
            Connect with skilled Taskers in your area for cleaning, handyman work, events, and more. Same-day service available.
          </p>
          
          <div className="relative max-w-xl mb-8">
            <Input 
              placeholder="What do you need help with?"
              className="w-full py-6 pl-4 pr-14 text-lg bg-primary-foreground rounded-lg border-0"
            />
            <Button 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90"
              onClick={() => navigate("/browse")}
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-8 text-primary-foreground/90">
            <div>
              <div className="text-2xl font-bold">500+</div>
              <div className="text-sm">Active Taskers</div>
            </div>
            <div className="w-px h-10 bg-primary-foreground/30" />
            <div>
              <div className="text-2xl font-bold">10K+</div>
              <div className="text-sm">Tasks Completed</div>
            </div>
            <div className="w-px h-10 bg-primary-foreground/30" />
            <div>
              <div className="text-2xl font-bold">4.8★</div>
              <div className="text-sm">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

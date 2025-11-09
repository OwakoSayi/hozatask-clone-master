import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-hero rounded-3xl p-12 lg:p-20 text-center shadow-lg">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-primary-foreground">
              Ready to get things done?
            </h2>
            <p className="text-xl text-primary-foreground/90">
              Join millions who trust HozaTask for their everyday needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="cta" className="text-lg" onClick={() => navigate("/auth")}>
                Get Started Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

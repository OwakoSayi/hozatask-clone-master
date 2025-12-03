import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="bg-primary rounded-2xl p-10 lg:p-16 text-center shadow-lg">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl lg:text-4xl font-bold text-primary-foreground">
              Ready to get things done?
            </h2>
            <p className="text-lg text-primary-foreground/90">
              Join thousands who trust HozaTask for their everyday needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                onClick={() => navigate("/auth")}
              >
                Get Started Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate("/browse")}
              >
                Browse Services
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

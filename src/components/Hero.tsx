import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-slide-up">
            <h1 className="text-4xl lg:text-6xl font-bold text-primary-foreground leading-tight">
              Get help with everyday tasks
            </h1>
            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              Connect with skilled Taskers in your area for cleaning, handyman work, deliveries, and more. Same-day service available.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="cta" className="text-lg">
                Book a Task
              </Button>
              <Button size="lg" variant="outline" className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Become a Tasker
              </Button>
            </div>
            <div className="flex items-center gap-8 text-primary-foreground/90">
              <div>
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-sm">Active Taskers</div>
              </div>
              <div className="w-px h-12 bg-primary-foreground/30" />
              <div>
                <div className="text-3xl font-bold">2M+</div>
                <div className="text-sm">Tasks Completed</div>
              </div>
              <div className="w-px h-12 bg-primary-foreground/30" />
              <div>
                <div className="text-3xl font-bold">4.8★</div>
                <div className="text-sm">Average Rating</div>
              </div>
            </div>
          </div>
          <div className="relative lg:block hidden animate-float">
            <img 
              src={heroImage} 
              alt="People helping with everyday tasks" 
              className="rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

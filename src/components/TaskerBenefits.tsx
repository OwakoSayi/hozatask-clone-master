import { Button } from "@/components/ui/button";
import { DollarSign, Clock, TrendingUp, Shield } from "lucide-react";

const benefits = [
  {
    icon: DollarSign,
    title: "Earn on Your Schedule",
    description: "Set your own rates and work when you want",
  },
  {
    icon: Clock,
    title: "Flexible Hours",
    description: "Choose tasks that fit your lifestyle",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    description: "Build your reputation and client base",
  },
  {
    icon: Shield,
    title: "Protected Payments",
    description: "Secure payments and insurance included",
  },
];

export const TaskerBenefits = () => {
  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Become a Tasker and Start Earning
              </h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of Taskers who are building their own businesses on HozaTask
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="space-y-2 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
            <Button size="lg" variant="cta" className="text-lg">
              Sign Up to Task
            </Button>
          </div>
          <div className="bg-gradient-hero rounded-2xl p-8 lg:p-12 text-primary-foreground shadow-lg">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Average Tasker Earnings</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-primary-foreground/10 rounded-lg">
                  <span>Per Hour</span>
                  <span className="text-2xl font-bold">$35-$65</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-primary-foreground/10 rounded-lg">
                  <span>Per Week (20 hrs)</span>
                  <span className="text-2xl font-bold">$700-$1,300</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-primary-foreground/10 rounded-lg">
                  <span>Top Earners/Month</span>
                  <span className="text-2xl font-bold">$6,000+</span>
                </div>
              </div>
              <p className="text-sm text-primary-foreground/80">
                *Earnings vary based on location, skills, and hours worked
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

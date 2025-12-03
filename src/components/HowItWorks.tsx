import { Search, Calendar, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Choose your task",
    description: "Browse categories or describe what you need help with",
  },
  {
    icon: Calendar,
    title: "Pick a Tasker",
    description: "Review profiles, ratings, and prices to find your perfect match",
  },
  {
    icon: CheckCircle,
    title: "Get it done",
    description: "Your Tasker arrives and completes your task with care",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl lg:text-4xl font-bold">How HozaTask Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get help in three simple steps
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="text-center space-y-4 animate-slide-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-hero flex items-center justify-center shadow-md">
                  <step.icon className="w-10 h-10 text-primary-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-primary">
                  Step {index + 1}
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

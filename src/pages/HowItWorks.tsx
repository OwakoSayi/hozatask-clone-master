import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Search, Calendar, CheckCircle, Star } from "lucide-react";

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Search,
      title: "Browse Services",
      description: "Search through verified taskers offering services from cleaning to home repairs across South Africa."
    },
    {
      icon: Calendar,
      title: "Book a Tasker",
      description: "Select a tasker, choose your preferred date and time, and provide task details."
    },
    {
      icon: CheckCircle,
      title: "Get It Done",
      description: "Your tasker arrives on time and completes the job to your satisfaction."
    },
    {
      icon: Star,
      title: "Leave a Review",
      description: "Rate your experience and help others find great taskers in the community."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 pt-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How HozaTask Works</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Getting help with everyday tasks has never been easier
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <Card key={index} className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent text-accent-foreground mb-4">
                <step.icon className="h-8 w-8" />
              </div>
              <div className="text-2xl font-bold text-primary mb-2">Step {index + 1}</div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </Card>
          ))}
        </div>

        <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of satisfied customers across South Africa who trust HozaTask for their everyday needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/browse")}>
                Browse Services
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/become-tasker")}>
                Become a Tasker
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">100%</div>
            <p className="text-muted-foreground">Verified Taskers</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">24-48h</div>
            <p className="text-muted-foreground">Verification Time</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">Safe</div>
            <p className="text-muted-foreground">Background Checked</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Clock, Shield, TrendingUp, Users } from "lucide-react";

const BecomeTasker = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Clock,
      title: "Flexible Schedule",
      description: "Work when you want, where you want. You're in control of your time."
    },
    {
      icon: TrendingUp,
      title: "Earn More",
      description: "Set your own rates and keep more of what you earn with competitive commissions."
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "We verify all clients and provide support throughout every job."
    },
    {
      icon: Users,
      title: "Growing Community",
      description: "Join thousands of taskers across South Africa helping their communities."
    }
  ];

  const requirements = [
    "Valid South African ID or Passport",
    "Proof of residential address",
    "Clean criminal record",
    "Skills or experience in your chosen category",
    "Professional attitude and reliability",
    "Smartphone for app communication"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 pt-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Become a HozaTask Tasker</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Turn your skills into income. Join South Africa's trusted task marketplace.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-4">
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Application Requirements</h2>
            <ul className="space-y-3">
              {requirements.map((requirement, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-2 h-2 rounded-full bg-accent mt-2 mr-3" />
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Verification Process</h2>
            <div className="space-y-4">
              <div>
                <div className="font-semibold mb-1">1. Submit Application</div>
                <p className="text-sm text-muted-foreground">Complete your profile and upload required documents.</p>
              </div>
              <div>
                <div className="font-semibold mb-1">2. Background Check</div>
                <p className="text-sm text-muted-foreground">We verify your identity and run safety checks (24-48 hours).</p>
              </div>
              <div>
                <div className="font-semibold mb-1">3. Get Approved</div>
                <p className="text-sm text-muted-foreground">Once verified, you can start accepting jobs immediately!</p>
              </div>
              <div>
                <div className="font-semibold mb-1">4. Start Earning</div>
                <p className="text-sm text-muted-foreground">Create your services and connect with clients in your area.</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 to-accent/5">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sign up today and start building your tasking business. Our verification process ensures trust and safety for everyone.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Apply to Become a Tasker
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Already have an account? <button onClick={() => navigate("/auth")} className="text-primary hover:underline">Sign in</button>
          </p>
        </Card>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8">Categories You Can Offer</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {["Cleaning", "Assembly", "Mounting", "Moving", "Outdoor Help", "Home Repairs", "Painting"].map((category) => (
              <Card key={category} className="px-6 py-3">
                <span className="font-medium">{category}</span>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BecomeTasker;

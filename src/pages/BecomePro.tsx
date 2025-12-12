import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { 
  CheckCircle, 
  Users, 
  Zap, 
  Shield, 
  TrendingUp,
  Star,
  MessageSquare,
  CreditCard
} from "lucide-react";

const BecomePro = () => {
  const navigate = useNavigate();
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");

  const handleGetStarted = () => {
    if (service) {
      navigate(`/become-pro/signup?category=${encodeURIComponent(service)}&location=${encodeURIComponent(location)}`);
    } else {
      navigate("/become-pro/signup");
    }
  };

  const benefits = [
    {
      icon: CreditCard,
      title: "No subscription fees",
      description: "There's no charge to join, no annual fees, and no membership fees. Only pay for leads you want."
    },
    {
      icon: Users,
      title: "Quality customers",
      description: "Connect with customers who are actively looking for your services and ready to hire."
    },
    {
      icon: Zap,
      title: "Control & flexibility",
      description: "Set your own prices, choose which leads to respond to, and manage your budget."
    },
    {
      icon: Shield,
      title: "Build your reputation",
      description: "Collect reviews, earn badges, and build trust with potential customers."
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Create your free profile",
      description: "Sign up and tell us about your business. It's free to join and takes just a few minutes."
    },
    {
      step: 2,
      title: "Get matched with leads",
      description: "We'll send you customer requests that match your services and service area."
    },
    {
      step: 3,
      title: "Send quotes & get hired",
      description: "Use credits to respond to leads. Only pay for the opportunities you want."
    },
    {
      step: 4,
      title: "Grow your business",
      description: "Deliver great work, collect reviews, and watch your business grow."
    }
  ];

  const testimonials = [
    {
      name: "Thabo M.",
      business: "Thabo's Plumbing",
      location: "Johannesburg",
      quote: "I've doubled my customer base since joining. The quality of leads is excellent!",
      rating: 5
    },
    {
      name: "Sarah K.",
      business: "Clean & Shine Services",
      location: "Cape Town",
      quote: "Finally a platform that connects me with customers who are actually ready to book.",
      rating: 5
    },
    {
      name: "David O.",
      business: "Dave's Electrical",
      location: "Durban",
      quote: "The pay-per-lead model means I only spend money on real opportunities.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-primary/20 text-primary border-0">
                Join 10,000+ South African Pros
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Get more customers.
                <span className="text-primary"> Grow your business.</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Connect with local customers looking for your services. 
                No subscription fees — only pay for leads you choose.
              </p>
              
              {/* Search Form */}
              <div className="bg-card p-6 rounded-xl shadow-lg border">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">What service do you provide?</label>
                    <SearchAutocomplete
                      type="service"
                      placeholder="e.g., Plumbing, Cleaning, Electrical"
                      value={service}
                      onChange={setService}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Where are you located?</label>
                    <SearchAutocomplete
                      type="location"
                      placeholder="e.g., Johannesburg, Cape Town"
                      value={location}
                      onChange={setLocation}
                    />
                  </div>
                  <Button 
                    className="w-full py-6 text-lg" 
                    size="lg"
                    onClick={handleGetStarted}
                  >
                    Sign up for free
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-3xl"></div>
                <img 
                  src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=500&fit=crop"
                  alt="Professional at work"
                  className="relative rounded-2xl shadow-2xl"
                />
                {/* Floating stats card */}
                <Card className="absolute -bottom-6 -left-6 shadow-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold">1000+ leads daily</p>
                        <p className="text-sm text-muted-foreground">Across South Africa</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Why pros choose us</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join thousands of service professionals growing their businesses
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Getting started is easy and takes just a few minutes
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[60%] w-[80%] border-t-2 border-dashed border-muted-foreground/30"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Transparency Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Simple, transparent pricing</h2>
            <p className="text-center text-muted-foreground mb-12">
              Only pay for leads you choose to respond to
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Free to join</h3>
                  <p className="text-sm text-muted-foreground">No signup fees or monthly subscriptions</p>
                </CardContent>
              </Card>
              <Card className="text-center border-primary">
                <CardContent className="p-6">
                  <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Pay per lead</h3>
                  <p className="text-sm text-muted-foreground">Use credits only when you send quotes</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <Shield className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">You're in control</h3>
                  <p className="text-sm text-muted-foreground">Set your budget and manage your credits</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground mb-4">
                New pros get <span className="font-semibold text-primary">3 free credits</span> to get started!
              </p>
              <Button size="lg" onClick={() => navigate("/become-pro/signup")}>
                Get started for free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">What pros are saying</h2>
          <p className="text-center text-muted-foreground mb-12">
            Hear from real professionals who've grown their businesses with us
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.business} • {testimonial.location}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to grow your business?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of professionals who are getting more customers and growing their businesses.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8"
            onClick={() => navigate("/become-pro/signup")}
          >
            Sign up for free
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BecomePro;

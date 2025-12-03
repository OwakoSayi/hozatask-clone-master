import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CATEGORIES } from "@/config/categories";
import { Search, Sparkles, Calendar, Users, CheckCircle, Gift, TreePine, PartyPopper } from "lucide-react";

// Popular service tags
const serviceTags = [
  "Holiday Decorating",
  "Gift Wrapping",
  "Snow Removal",
  "Running Errands",
  "Party Cleaning",
];

// Featured categories to display
const featuredCategories = [
  "Event Planning",
  "Gardening & Landscaping",
  "House Cleaning",
  "Handyman Services",
  "Moving & Delivery",
  "Photography",
];

// Popular projects
const popularProjects = [
  { title: "Grass Cutting", description: "Professional lawn care", icon: "🌿" },
  { title: "Mount a TV", description: "TV mounting & setup", icon: "📺" },
  { title: "Pet Sitting", description: "Care for your pets", icon: "🐕" },
  { title: "Jumping Castles", description: "Party entertainment", icon: "🏰" },
];

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    if (params.get("type") === "recovery") {
      window.location.hash = "/reset-password";
    }
  }, []);

  const displayCategories = CATEGORIES.filter((cat) => featuredCategories.includes(cat.name));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-primary py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary-foreground/20 p-3 rounded-lg">
              <TreePine className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <p className="text-primary-foreground/80 text-sm">Seasonal</p>
              <p className="text-primary-foreground/80 text-sm">PROMO</p>
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-6">
            Book trusted help for event & home services instantly
          </h1>
          
          {/* Search Bar */}
          <div className="relative mb-8">
            <Input 
              placeholder="What do you need help with?"
              className="w-full py-6 pl-4 pr-12 text-lg bg-primary-foreground rounded-lg border-0"
            />
            <Button 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Seasonal Message */}
      <section className="py-8 px-4 bg-accent">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-serif italic text-foreground">
              "Tis the Season to get things done"
            </h2>
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Your right to relax beside and make a plan
          </p>
          <p className="text-foreground font-medium mb-6">
            Book a HozaTasker for your tasks, big or small!
          </p>
          
          {/* Service Tags */}
          <div className="flex flex-wrap justify-center gap-2">
            {serviceTags.map((tag) => (
              <Button 
                key={tag} 
                variant="outline" 
                size="sm"
                className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => navigate(`/browse?search=${encodeURIComponent(tag)}`)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Category Icons */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {displayCategories.map((category) => (
              <div
                key={category.slug}
                className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/browse?category=${encodeURIComponent(category.name)}`)}
              >
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-3xl">
                  {category.icon}
                </div>
                <span className="text-xs text-center text-foreground font-medium">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-6 px-4 border-y border-border">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center items-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Vetted Taskers</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Affordable Prices</span>
            </div>
            <div className="flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Satisfaction Guaranteed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Projects */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Popular Projects</h2>
          <div className="space-y-3">
            {popularProjects.map((project) => (
              <Card 
                key={project.title} 
                className="cursor-pointer hover:shadow-md transition-shadow border-border"
                onClick={() => navigate(`/browse?search=${encodeURIComponent(project.title)}`)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center text-2xl">
                    {project.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                  <div className="text-primary">→</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => navigate("/browse")}>
              See More
            </Button>
          </div>
        </div>
      </section>

      {/* Your Satisfaction Guaranteed */}
      <section className="py-12 px-4 bg-muted">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
            Your satisfaction, guaranteed
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            HozaTasker Pledge: A commitment to every booking
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Vetted Taskers</h3>
                <p className="text-sm text-muted-foreground">All our taskers are thoroughly vetted and verified</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Dedicated Support</h3>
                <p className="text-sm text-muted-foreground">Our team is here to help you every step of the way</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Happiness Pledge</h3>
                <p className="text-sm text-muted-foreground">If you're not happy, we'll make it right</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">How it works</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Browse & Select</h3>
                <p className="text-sm text-muted-foreground">Choose your services you need help with</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Pay Booking Fee</h3>
                <p className="text-sm text-muted-foreground">R50 to secure your booking</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Get Matched</h3>
                <p className="text-sm text-muted-foreground">We connect you with the best available provider</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 bg-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary-foreground">
            Ready to Book Your Home or Event Service?
          </h2>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Flexible Scheduling</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Vetted Pros</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <Gift className="w-4 h-4" />
              <span className="text-sm">Fair Prices</span>
            </div>
          </div>
          
          {/* Search in CTA */}
          <div className="relative max-w-md mx-auto mb-6">
            <Input 
              placeholder="Search for a service..."
              className="w-full py-5 pl-4 pr-12 bg-primary-foreground rounded-lg border-0"
            />
            <Button 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
          
          <Button 
            size="lg" 
            variant="outline"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 border-0"
            onClick={() => navigate("/browse")}
          >
            See More
          </Button>
        </div>
      </section>

      {/* Become a Tasker */}
      <section className="py-8 px-4 bg-accent">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-foreground mb-4">Become a HozaTasker</p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/supplier-submission")}>
              Register Now
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

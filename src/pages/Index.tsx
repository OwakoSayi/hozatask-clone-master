import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CATEGORIES } from "@/config/categories";
import { Search, MessageSquare, Users, CheckCircle, Star, ArrowRight } from "lucide-react";

// Featured categories to display on homepage
const featuredCategories = [
  "Event Planning",
  "Gardening & Landscaping",
  "House Cleaning",
  "Handyman Services",
  "Moving & Delivery",
  "Makeup Artists",
  "Photography",
  "Catering",
  "Plumbing",
  "Electrical Work",
  "Furniture Assembly",
  "Painting & Decorating",
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

      {/* Hero Section - Thumbtack style */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 md:py-24 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Find the right pro for your project
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Tell us what you need. Get free quotes from local professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/post-project")}
              className="text-lg px-8 py-6"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Get Free Quotes
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/suppliers")}
              className="text-lg px-8 py-6"
            >
              <Search className="mr-2 h-5 w-5" />
              Browse Pros
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works - Thumbtack style */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">1. Tell us what you need</h3>
              <p className="text-muted-foreground">
                Answer a few questions about your project. It only takes a minute.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">2. Get free quotes</h3>
              <p className="text-muted-foreground">
                Local pros will review your request and send personalized quotes.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">3. Hire the best</h3>
              <p className="text-muted-foreground">
                Compare quotes, read reviews, and hire when you're ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
            Popular Services
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Browse by category or post a project to get quotes
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {displayCategories.map((category) => (
              <Card
                key={category.slug}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-border group"
                onClick={() => navigate(`/post-project?category=${encodeURIComponent(category.name)}`)}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="text-5xl mb-3">{category.icon}</div>
                  <h3 className="font-semibold text-foreground">{category.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors">
                    Get quotes →
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8 flex gap-4 justify-center">
            <Button variant="outline" size="lg" onClick={() => navigate("/post-project")}>
              Post a Project
            </Button>
            <Button size="lg" onClick={() => navigate("/suppliers")}>
              Browse All Pros
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold">500+</p>
              <p className="text-sm opacity-80">Verified Pros</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold">10K+</p>
              <p className="text-sm opacity-80">Projects Completed</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <p className="text-3xl md:text-4xl font-bold">4.8</p>
                <Star className="h-6 w-6 fill-current" />
              </div>
              <p className="text-sm opacity-80">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">
            Post your project for free and start receiving quotes from top-rated pros in your area.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/post-project")}>
              Post a Project - It's Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/supplier-submission")}>
              Join as a Pro
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

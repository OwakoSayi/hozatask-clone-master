import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const categories = [
  { name: "Jumping Castles", icon: "🏰", slug: "jumping-castles" },
  { name: "Makeup Artists", icon: "💄", slug: "makeup" },
  { name: "Event Décor", icon: "🎨", slug: "decor" },
  { name: "Grass Cutting", icon: "🌿", slug: "grass-cutting" },
  { name: "Cleaning Services", icon: "🧹", slug: "cleaning" },
  { name: "Tents & Gazebos", icon: "⛺", slug: "tents" },
  { name: "DJ Services", icon: "🎵", slug: "dj" },
  { name: "Catering", icon: "🍽️", slug: "catering" },
  { name: "Photography", icon: "📸", slug: "photography" },
  { name: "Handyman", icon: "🔧", slug: "handyman" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Book Trusted Event Services Instantly
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            We Match You to the Best Available Provider
          </p>
          <Button 
            size="lg" 
            onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-lg px-8 py-6"
          >
            Browse Services
          </Button>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            Choose Your Service Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {categories.map((category) => (
              <Card
                key={category.slug}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-border"
                onClick={() => navigate(`/category/${category.slug}`)}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="text-5xl mb-3">{category.icon}</div>
                  <h3 className="font-semibold text-foreground">{category.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Browse & Select</h3>
              <p className="text-muted-foreground">Choose 1-3 service options you like</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Pay Booking Fee</h3>
              <p className="text-muted-foreground">R50 to secure availability</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2 text-foreground">Get Matched</h3>
              <p className="text-muted-foreground">We connect you with the best provider</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Book Your Event Service?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of satisfied customers who trust HozaTask for their events
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/supplier-submission')}
            variant="outline"
            className="mr-4"
          >
            List Your Service
          </Button>
          <Button 
            size="lg" 
            onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Book Now
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

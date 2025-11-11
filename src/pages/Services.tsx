import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sparkles, Wrench, Hammer, Truck, TreePine, Home, Paintbrush } from "lucide-react";

const Services = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: Sparkles,
      title: "Cleaning",
      description: "Home cleaning, deep cleaning, move-in/out cleaning, and more.",
      features: ["Professional cleaners", "Eco-friendly products", "Flexible scheduling"]
    },
    {
      icon: Wrench,
      title: "Assembly",
      description: "Furniture assembly, flat-pack building, and installation services.",
      features: ["Ikea specialists", "Quick turnaround", "All tools provided"]
    },
    {
      icon: Hammer,
      title: "Mounting",
      description: "TV mounting, shelf installation, picture hanging, and more.",
      features: ["Safe installation", "Cable management", "Wall protection"]
    },
    {
      icon: Truck,
      title: "Moving",
      description: "Packing, loading, transportation, and unpacking services.",
      features: ["Careful handling", "Insured service", "Same-day available"]
    },
    {
      icon: TreePine,
      title: "Outdoor Help",
      description: "Gardening, lawn care, pressure washing, and outdoor maintenance.",
      features: ["Garden experts", "Regular maintenance", "Seasonal services"]
    },
    {
      icon: Home,
      title: "Home Repairs",
      description: "Plumbing, electrical, carpentry, and general handyman services.",
      features: ["Licensed professionals", "Quality guaranteed", "Emergency service"]
    },
    {
      icon: Paintbrush,
      title: "Painting",
      description: "Interior and exterior painting, touch-ups, and color consultation.",
      features: ["Expert painters", "Premium paints", "Clean finish"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 pt-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From everyday chores to specialized tasks, we've got you covered across South Africa
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent text-accent-foreground mb-4">
                <service.icon className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
              <p className="text-muted-foreground mb-4">{service.description}</p>
              <ul className="space-y-2">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 to-accent/5">
          <h2 className="text-3xl font-bold mb-4">Need a Service?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Browse hundreds of verified taskers ready to help with your task today
          </p>
          <Button size="lg" onClick={() => navigate("/browse")}>
            Browse All Services
          </Button>
        </Card>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">All Taskers Are:</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card className="p-6">
              <div className="text-4xl mb-2">✓</div>
              <h4 className="font-semibold mb-1">Background Checked</h4>
              <p className="text-sm text-muted-foreground">Full verification process</p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-2">★</div>
              <h4 className="font-semibold mb-1">Highly Rated</h4>
              <p className="text-sm text-muted-foreground">Customer reviewed</p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-2">🛡️</div>
              <h4 className="font-semibold mb-1">Insured</h4>
              <p className="text-sm text-muted-foreground">Protected service</p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Services;

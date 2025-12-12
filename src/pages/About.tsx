import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, Shield, Target, Heart, Briefcase, Star } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: Users,
      title: "Community First",
      description: "We believe in building strong communities by connecting skilled professionals with people who need their services.",
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "Every pro on our platform goes through verification to ensure quality and reliability for our customers.",
    },
    {
      icon: Target,
      title: "Quality Service",
      description: "We're committed to delivering exceptional experiences through our carefully vetted network of professionals.",
    },
    {
      icon: Heart,
      title: "Customer Care",
      description: "Your satisfaction is our priority. We're here to support you every step of the way.",
    },
  ];

  const stats = [
    { value: "10K+", label: "Jobs Completed" },
    { value: "500+", label: "Verified Pros" },
    { value: "4.8", label: "Average Rating" },
    { value: "50+", label: "Service Categories" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About HozaTask</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              We're on a mission to make it easy for people to find and hire trusted local professionals 
              for any project, big or small.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/post-project")}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/become-pro")}>
                Join as a Pro
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
              <div className="prose prose-lg mx-auto text-muted-foreground">
                <p className="mb-4">
                  HozaTask was founded with a simple idea: make it easier for people to find trusted 
                  professionals for their home and business needs. What started as a small project has 
                  grown into a thriving marketplace connecting thousands of customers with skilled pros.
                </p>
                <p className="mb-4">
                  We understand that finding the right person for a job can be challenging. That's why 
                  we've built a platform that prioritizes trust, quality, and transparency. Every 
                  professional on HozaTask is verified, and our review system helps you make informed decisions.
                </p>
                <p>
                  Whether you need help with home cleaning, repairs, moving, or any other service, 
                  HozaTask is here to help you get it done right.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust HozaTask for their service needs.
            </p>
            <Button size="lg" onClick={() => navigate("/post-project")}>
              Post Your Project
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
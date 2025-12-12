import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Briefcase, Heart, Users, Rocket } from "lucide-react";

const Careers = () => {
  const benefits = [
    { icon: Heart, title: "Health & Wellness", description: "Comprehensive medical, dental, and vision coverage" },
    { icon: Clock, title: "Flexible Hours", description: "Work-life balance with flexible scheduling" },
    { icon: Rocket, title: "Growth", description: "Career development and learning opportunities" },
    { icon: Users, title: "Great Team", description: "Collaborative and inclusive work environment" },
  ];

  const openings = [
    {
      title: "Senior Software Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Cape Town",
      type: "Full-time",
    },
    {
      title: "Customer Success Manager",
      department: "Operations",
      location: "Johannesburg",
      type: "Full-time",
    },
    {
      title: "Marketing Specialist",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Join Our Team</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Help us build the future of local services. We're looking for passionate people 
              who want to make a difference.
            </p>
            <Button size="lg" onClick={() => document.getElementById('openings')?.scrollIntoView({ behavior: 'smooth' })}>
              View Open Positions
            </Button>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Why Work With Us</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section id="openings" className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Open Positions</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {openings.map((job, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {job.department}
                          </Badge>
                          <Badge variant="outline">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.location}
                          </Badge>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {job.type}
                          </Badge>
                        </div>
                      </div>
                      <Button>Apply Now</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-8">
              Don't see a role that fits? Send your resume to{" "}
              <a href="mailto:careers@hozatask.com" className="text-primary hover:underline">
                careers@hozatask.com
              </a>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Careers;
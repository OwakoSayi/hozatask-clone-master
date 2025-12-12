import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, CheckCircle, RefreshCw, Headphones, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Guarantee = () => {
  const navigate = useNavigate();

  const guarantees = [
    {
      icon: CheckCircle,
      title: "Satisfaction Promise",
      description: "If you're not satisfied with the service, we'll work with you and the pro to make it right.",
    },
    {
      icon: RefreshCw,
      title: "Free Re-Service",
      description: "If the job isn't done to your standards, we'll arrange a free re-service or find you a new pro.",
    },
    {
      icon: Shield,
      title: "Protection Coverage",
      description: "Your bookings are protected. If something goes wrong, we're here to help resolve it.",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Our support team is available around the clock to assist with any issues or concerns.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">The HozaTask Guarantee</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Book with confidence. We stand behind every job booked through our platform.
            </p>
          </div>
        </section>

        {/* Guarantee Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {guarantees.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">How Our Guarantee Works</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Book Through HozaTask</h3>
                  <p className="text-muted-foreground">
                    Your guarantee is active when you book and pay through our platform. This ensures 
                    we can help if anything goes wrong.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Report Any Issues</h3>
                  <p className="text-muted-foreground">
                    If you're not satisfied, contact us within 48 hours of service completion. 
                    Provide details about what went wrong.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">We Make It Right</h3>
                  <p className="text-muted-foreground">
                    We'll work with you and the pro to resolve the issue. This may include a 
                    re-service, partial refund, or connecting you with a new pro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-8 w-8 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-2xl font-semibold mb-2">4.8 out of 5 stars</p>
            <p className="text-muted-foreground mb-8">Based on thousands of customer reviews</p>
            <Button size="lg" onClick={() => navigate("/post-project")}>
              Book With Confidence
            </Button>
          </div>
        </section>

        {/* Terms */}
        <section className="py-12 border-t">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center text-sm text-muted-foreground">
              <p>
                The HozaTask Guarantee applies to eligible bookings made and paid through our platform. 
                Some exclusions may apply. See our{" "}
                <a href="/terms" className="text-primary hover:underline">Terms of Use</a> for full details.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Guarantee;
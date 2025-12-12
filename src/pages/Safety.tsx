import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, UserCheck, Eye, Lock, AlertTriangle, CheckCircle } from "lucide-react";

const Safety = () => {
  const safetyFeatures = [
    {
      icon: UserCheck,
      title: "Pro Verification",
      description: "Every professional undergoes identity verification and background screening before joining our platform.",
    },
    {
      icon: Eye,
      title: "Reviews & Ratings",
      description: "Transparent review system helps you make informed decisions based on real customer experiences.",
    },
    {
      icon: Lock,
      title: "Secure Payments",
      description: "All transactions are protected with industry-standard encryption and secure payment processing.",
    },
    {
      icon: Shield,
      title: "Insurance Coverage",
      description: "Many of our pros carry liability insurance for additional peace of mind on your projects.",
    },
  ];

  const tips = [
    "Always book through the HozaTask platform for protection",
    "Read reviews and ratings before hiring a pro",
    "Communicate all project details through our messaging system",
    "Verify the pro's identity when they arrive",
    "Never pay cash outside the platform",
    "Report any concerns to our support team immediately",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Your Safety Matters</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're committed to creating a safe and trustworthy marketplace for both customers and pros.
            </p>
          </div>
        </section>

        {/* Safety Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">How We Keep You Safe</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {safetyFeatures.map((feature, index) => (
                <Card key={index}>
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Safety Tips */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Safety Tips</h2>
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  <ul className="space-y-4">
                    {tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Report Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Report a Safety Concern</h2>
              <p className="text-muted-foreground mb-6">
                If you experience any issues or have concerns about a pro or customer, 
                please report it immediately. We take all reports seriously and will investigate promptly.
              </p>
              <a 
                href="mailto:safety@hozatask.com" 
                className="text-primary text-lg hover:underline"
              >
                safety@hozatask.com
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Safety;
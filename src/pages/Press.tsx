import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Mail, Calendar } from "lucide-react";

const Press = () => {
  const pressReleases = [
    {
      date: "December 2024",
      title: "HozaTask Expands Services to New Regions",
      excerpt: "HozaTask announces expansion into 5 new provinces, bringing trusted local services to more communities across South Africa.",
    },
    {
      date: "November 2024",
      title: "HozaTask Launches Pro Verification Program",
      excerpt: "New verification system ensures all professionals meet quality and safety standards before joining the platform.",
    },
    {
      date: "October 2024",
      title: "HozaTask Reaches 10,000 Completed Jobs Milestone",
      excerpt: "Platform celebrates major milestone as community continues to grow with satisfied customers and skilled professionals.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Press & Media</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Get the latest news about HozaTask. For press inquiries, please contact our media team.
            </p>
            <Button size="lg">
              <Mail className="h-4 w-4 mr-2" />
              Contact Press Team
            </Button>
          </div>
        </section>

        {/* Press Kit */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Press Kit</h2>
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-6">
                    Download our press kit for logos, brand guidelines, and company information.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Logo Pack
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Brand Guidelines
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Press Releases */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Latest News</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              {pressReleases.map((release, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <Badge variant="secondary" className="mb-3">
                      <Calendar className="h-3 w-3 mr-1" />
                      {release.date}
                    </Badge>
                    <h3 className="font-semibold text-lg mb-2">{release.title}</h3>
                    <p className="text-muted-foreground">{release.excerpt}</p>
                    <Button variant="link" className="px-0 mt-2">
                      Read more →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Media Inquiries</h2>
            <p className="text-muted-foreground mb-4">
              For press and media inquiries, please contact:
            </p>
            <a href="mailto:press@hozatask.com" className="text-primary text-lg hover:underline">
              press@hozatask.com
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Press;
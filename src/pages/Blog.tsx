import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, User } from "lucide-react";

const Blog = () => {
  const posts = [
    {
      title: "10 Tips for Finding the Perfect Home Cleaner",
      excerpt: "Looking for a reliable home cleaner? Here's what to look for when hiring a cleaning professional for your home.",
      category: "Tips",
      author: "HozaTask Team",
      date: "Dec 10, 2024",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=400&fit=crop",
    },
    {
      title: "How to Prepare for Your Moving Day",
      excerpt: "Moving can be stressful. Follow these steps to ensure a smooth transition to your new home.",
      category: "Guides",
      author: "HozaTask Team",
      date: "Dec 5, 2024",
      image: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800&h=400&fit=crop",
    },
    {
      title: "Why Background Checks Matter When Hiring Pros",
      excerpt: "Safety first! Learn why verified professionals make all the difference for your peace of mind.",
      category: "Safety",
      author: "HozaTask Team",
      date: "Nov 28, 2024",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=400&fit=crop",
    },
    {
      title: "Seasonal Home Maintenance Checklist",
      excerpt: "Keep your home in top shape year-round with this comprehensive maintenance guide.",
      category: "Tips",
      author: "HozaTask Team",
      date: "Nov 20, 2024",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop",
    },
    {
      title: "How to Get the Best Quotes from Service Pros",
      excerpt: "Get accurate quotes and find the best value by following these simple tips.",
      category: "Guides",
      author: "HozaTask Team",
      date: "Nov 15, 2024",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
    },
    {
      title: "Success Story: From Side Hustle to Full-Time Pro",
      excerpt: "Meet Sarah, a cleaning professional who grew her business through HozaTask.",
      category: "Stories",
      author: "HozaTask Team",
      date: "Nov 10, 2024",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=400&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">HozaTask Blog</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tips, guides, and stories to help you get the most out of local services.
            </p>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-3 left-3">{post.category}</Badge>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Posts
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Subscribe to our newsletter for the latest tips and updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-md border bg-background"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
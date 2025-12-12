import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  getPopularCategories, 
  QUICK_LINK_CATEGORIES, 
  PROJECT_TABS,
  getCategoryByName 
} from "@/config/categories";
import { Shield, Clock, CheckCircle, ChevronRight, Star } from "lucide-react";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const popularCategories = getPopularCategories();

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/post-project?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section - Thumbtack style */}
      <section className="pt-16 pb-8 px-4 bg-background">
        <div className="container mx-auto text-center max-w-3xl">
          {/* Logo Icon */}
          <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-primary-foreground text-2xl font-bold">H</span>
          </div>
          
          {/* Rotating Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-tight">
            Home improvement,<br />
            <span className="text-primary">made easy.</span>
          </h1>

          {/* Search Bar - Thumbtack style with autocomplete */}
          <div className="flex flex-col md:flex-row gap-3 max-w-2xl mx-auto bg-background border border-border rounded-lg p-2 shadow-lg">
            <SearchAutocomplete
              type="service"
              value={searchQuery}
              onChange={setSearchQuery}
              onKeyPress={handleKeyPress}
              placeholder="What do you need help with?"
              className="text-base"
            />
            <div className="border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-2">
              <SearchAutocomplete
                type="location"
                value={location}
                onChange={setLocation}
                onKeyPress={handleKeyPress}
                placeholder="Location"
                className="w-full md:w-40"
              />
            </div>
            <Button onClick={handleSearch} size="lg" className="px-8">
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Hero Image - Thumbtack style */}
      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative mx-auto">
            <div className="aspect-video bg-gradient-to-b from-primary/5 to-transparent rounded-full overflow-hidden flex items-end justify-center">
              <img 
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop"
                alt="Beautiful home"
                className="w-full max-w-lg rounded-t-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pros for every project */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
            Pros for every project
          </h2>
          <p className="text-center text-muted-foreground mb-8">in your area</p>
          
          {/* Service Pills - Scrollable */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {popularCategories.map((category) => (
              <Button
                key={category.slug}
                variant="outline"
                className="rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => navigate(`/post-project?category=${encodeURIComponent(category.name)}`)}
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-4">
            {QUICK_LINK_CATEGORIES.map((categoryName) => {
              const category = getCategoryByName(categoryName);
              return (
                <Button
                  key={categoryName}
                  variant="link"
                  className="text-primary underline"
                  onClick={() => navigate(`/post-project?category=${encodeURIComponent(categoryName)}`)}
                >
                  {categoryName}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why customers love us */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Why customers love HozaTask.
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Every day, thousands of customers like you rely on HozaTask to care for their homes—and we've got your back if things don't go as planned.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Get to a hire faster.</h3>
              <p className="text-muted-foreground text-sm">
                Share details about your project in your own words, so we can find your best fit.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Only see local, trusted pros.</h3>
              <p className="text-muted-foreground text-sm">
                We'll only show you pros we're confident can do the job.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">A job done right—guaranteed.</h3>
              <p className="text-muted-foreground text-sm">
                If the job isn't done as agreed, we'll help make it right.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Explore more projects - Tabs */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Explore more projects.
          </h2>

          <Tabs defaultValue="home-maintenance" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-2xl mx-auto mb-8 h-auto">
              {PROJECT_TABS.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="text-xs md:text-sm py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {PROJECT_TABS.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-lg mb-4">{tab.title}</p>
                        <Button 
                          variant="link" 
                          className="text-primary p-0"
                          onClick={() => navigate("/post-project")}
                        >
                          {tab.description}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {tab.services.map((serviceName) => {
                          const category = getCategoryByName(serviceName);
                          return (
                            <Button
                              key={serviceName}
                              variant="outline"
                              className="rounded-full"
                              onClick={() => navigate(`/post-project?category=${encodeURIComponent(serviceName)}`)}
                            >
                              {category && <span className="mr-1">{category.icon}</span>}
                              {serviceName}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Resources for your home */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Resources for your home.
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Sometimes getting started is the hardest part. We've got expert guidance for your next project.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => navigate("/cost-guides")}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Cost guides</h3>
                <p className="text-muted-foreground text-sm">
                  Estimate costs for all your home projects.
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => navigate("/post-project")}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <span className="text-2xl">🔧</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Maintenance tips</h3>
                <p className="text-muted-foreground text-sm">
                  Tips to keep your home in great shape all year long.
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => navigate("/post-project")}
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <span className="text-2xl">📖</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Project guides</h3>
                <p className="text-muted-foreground text-sm">
                  How-to guides for DIY and hiring pros.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-secondary text-secondary-foreground">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Trusted pros, everywhere you need them.
          </h2>
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">500+</p>
              <p className="text-sm opacity-80">Verified Pros</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">10K+</p>
              <p className="text-sm opacity-80">Projects Completed</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <p className="text-3xl md:text-4xl font-bold text-primary">4.8</p>
                <Star className="h-6 w-6 text-primary fill-primary" />
              </div>
              <p className="text-sm opacity-80">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* App Download CTA - Thumbtack style */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The one app you need to get<br />everything done.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            From custom guides made just for you to effortless project planning, it's all here — in one free app.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/post-project")}>
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/become-pro")}>
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

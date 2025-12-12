import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { getPopularCategories } from "@/config/categories";

const popularCategories = getPopularCategories().slice(0, 4);

export const Categories = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl lg:text-4xl font-bold">Popular Services</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our most requested categories and find the perfect Tasker for your needs
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularCategories.map((category, index) => (
            <Card 
              key={category.slug}
              className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group bg-card border-border hover:border-primary/30 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(`/post-project?category=${encodeURIComponent(category.name)}`)}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                  <span className="text-3xl">{category.icon}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {category.group}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

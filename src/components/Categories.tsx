import { Card } from "@/components/ui/card";
import { CATEGORIES } from "@/config/categories";
import cleaningIcon from "@/assets/cleaning-icon.jpg";
import handymanIcon from "@/assets/handyman-icon.jpg";
import movingIcon from "@/assets/moving-icon.jpg";
import assemblyIcon from "@/assets/assembly-icon.jpg";

const categoryDetails = [
  {
    title: "Cleaning",
    description: "Home cleaning, deep cleaning, organizing",
    icon: cleaningIcon,
    price: "From R250/hr",
  },
  {
    title: "Handyman",
    description: "Repairs, installations, minor fixes",
    icon: handymanIcon,
    price: "From $55/hr",
  },
  {
    title: "Moving & Delivery",
    description: "Help moving, furniture delivery, hauling",
    icon: movingIcon,
    price: "From $50/hr",
  },
  {
    title: "Assembly",
    description: "Furniture assembly, TV mounting, setup",
    icon: assemblyIcon,
    price: "From $45/hr",
  },
];

export const Categories = () => {
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
          {categoryDetails.map((category, index) => (
            <Card 
              key={index}
              className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group bg-card border-border hover:border-primary/30 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <img 
                    src={category.icon} 
                    alt={category.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {category.description}
                  </p>
                  <p className="text-primary font-semibold text-sm">
                    {category.price}
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

import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { HowItWorks } from "@/components/HowItWorks";
import { TaskerBenefits } from "@/components/TaskerBenefits";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Categories />
        <HowItWorks />
        <TaskerBenefits />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

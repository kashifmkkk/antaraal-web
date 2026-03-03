import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import ServicesSection from "@/components/ServicesSections";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <FeaturedProducts />
      <ServicesSection />
      <SubscriptionPlans />
      <Toaster />
    </div>
  );
};

export default Index;

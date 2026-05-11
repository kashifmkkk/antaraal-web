import PricingRanges from "@/components/PricingRanges";
import { useAuth } from "@/context/AuthContext";

const PricingRangesPage = () => {
  const { user } = useAuth();
  const role = user?.role ?? null;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-4">Pricing Ranges</h1>
      <p className="text-muted-foreground mb-6">View pricing guidance for buyers and sellers.</p>
      <PricingRanges role={role} />
    </div>
  );
};

export default PricingRangesPage;

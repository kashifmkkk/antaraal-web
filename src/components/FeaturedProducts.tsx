import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchJson } from "@/lib/api";
import QuoteModal from "./QuoteModal";
import engineBlade from "@/assets/engine-blade.jpg";
import landingGear from "@/assets/landing-gear.jpg";
import hydraulicPump from "@/assets/hydraulic-pump.jpg";
import avionicsUnit from "@/assets/avionics-unit.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type ApiProduct = {
  id: number;
  name: string;
  category: string;
  image: string;
  description?: string | null;
  vendor?: string | null;
  availability?: string | null;
  warranty?: string | null;
  rating?: number | null;
  status?: string | null;
  warrantyExpiry?: string | null;
};

type UiProduct = {
  id: number;
  name: string;
  category: string;
  image: string;
  description: string;
  vendor: string;
  availability: string;
  warranty: string;
  rating: number;
  status: string;
  warrantyExpiry: string;
  photos?: string[];
  price?: string | number | null;
};

const imageMap: Record<string, string> = {
  "engine-blade.jpg": engineBlade,
  "landing-gear.jpg": landingGear,
  "hydraulic-pump.jpg": hydraulicPump,
  "avionics-unit.jpg": avionicsUnit,
};

function mapProduct(product: ApiProduct): UiProduct {
  const displayAvailability = product.availability && product.availability.length > 0 ? product.availability : "On request";
  const displayWarranty = product.warranty && product.warranty.length > 0 ? product.warranty : "Standard";
  const rating = typeof product.rating === "number" ? product.rating : 4.5;
  const status = product.status && product.status.length > 0 ? product.status : "available";
  const description = product.description && product.description.length > 0 ? product.description : "No description provided.";
  let warrantyExpiry = "Not specified";
  if (product.warrantyExpiry) {
    const parsedDate = new Date(product.warrantyExpiry);
    if (!Number.isNaN(parsedDate.getTime())) {
      warrantyExpiry = parsedDate.toLocaleDateString();
    }
  }

  const resolveImage = (url?: string) => {
    if (!url) return engineBlade;
    if (/^https?:\/\//i.test(url)) return url;
    const key = url.replace(/^\//, '');
    return imageMap[key] ?? url ?? engineBlade;
  };

  return {
    id: product.id,
    name: product.name,
    category: product.category,
    photos: (product as any).photos ?? [],
    image: resolveImage(((product as any).photos && (product as any).photos.length > 0) ? (product as any).photos[0] : product.image),
    price: (product as any).price ?? null,
    description,
    vendor: product.vendor && product.vendor.length > 0 ? product.vendor : "Verified Vendor",
    availability: displayAvailability,
    warranty: displayWarranty,
    rating,
    status,
    warrantyExpiry,
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "available":
      return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="w-3 h-3 mr-1" />Available</Badge>;
    case "limited":
      return <Badge className="bg-warning text-warning-foreground"><Clock className="w-3 h-3 mr-1" />Limited</Badge>;
    case "preorder":
      return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Pre-order</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
}

const FeaturedProducts = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<UiProduct | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const { user } = useAuth();
  const canRaiseRfq = user?.role === "BUYER" || user?.role === "ADMIN";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => fetchJson<ApiProduct[]>("/api/products"),
    staleTime: 30_000,
  });

  const products = useMemo(() => (data ?? []).map(mapProduct), [data]);

  const handleRFQ = (product: UiProduct) => {
    setSelectedProduct(product);
    setIsQuoteModalOpen(true);
  };

  const handleViewAllProducts = () => {
    navigate("/products");
  };

  return (
    <section className="py-10 sm:py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Featured Products</h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover high-quality aerospace parts from our verified vendor network
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {isLoading && (
            <Card className="flex items-center justify-center h-64">
              <CardContent className="text-muted-foreground">Loading featured products…</CardContent>
            </Card>
          )}
          {isError && !isLoading && (
            <Card className="flex items-center justify-center h-64">
              <CardContent className="text-muted-foreground">Unable to load featured products.</CardContent>
            </Card>
          )}
          {!isLoading && !isError && products.length === 0 && (
            <Card className="flex items-center justify-center h-64">
              <CardContent className="text-muted-foreground">No products available yet.</CardContent>
            </Card>
          )}
          {!isLoading && !isError && products.map((product) => (
            <Card
              key={product.id}
              onClick={() => navigate(`/products/${product.id}`)}
              role="button"
              className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                  {getStatusBadge(product.status)}
                </div>
                <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                  {product.name}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <ShieldCheck className="w-3 h-3 text-primary" />
                  <span>{product.vendor}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{product.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-sm">
                    <Star className="w-4 h-4 fill-primary text-primary mr-1" />
                    {product.rating.toFixed(1)}
                  </div>
                  <Badge variant="secondary">{product.availability}</Badge>
                </div>
                <div className="text-xs text-muted-foreground border border-dashed border-primary/30 rounded-lg px-3 py-2">
                  Warranty: <span className="font-medium text-foreground">{product.warranty}</span>
                </div>

                {product.price && (
                  <p className="text-base font-bold mt-2">₹{Number(product.price).toLocaleString()}</p>
                )}

                <div className="flex gap-2 pt-2">
                  {canRaiseRfq && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleRFQ(product); }}
                    >
                      RFQ
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button
            variant="outline"
            size="lg"
            onClick={handleViewAllProducts}
          >
            View All Products
          </Button>
        </div>

        <QuoteModal
          isOpen={isQuoteModalOpen}
          onClose={() => setIsQuoteModalOpen(false)}
          productName={selectedProduct?.name}
        />
      </div>
    </section>
  );
};

export default FeaturedProducts;
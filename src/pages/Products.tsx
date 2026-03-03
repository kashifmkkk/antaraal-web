import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson, apiUrl } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ShieldCheck, CheckCircle2, Clock, AlertTriangle, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QuoteModal from "@/components/QuoteModal";
import { useAuth } from "@/context/AuthContext";
import LoadingLogo from "@/components/LoadingLogo";
import { useToast } from "@/hooks/use-toast";
import engineBlade from "@/assets/engine-blade.jpg";
import hydraulicPump from "@/assets/hydraulic-pump.jpg";
import landingGear from "@/assets/landing-gear.jpg";
import avionicsUnit from "@/assets/avionics-unit.jpg";

type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  productCount: number;
  _count?: { products: number };
};

type ApiProduct = {
  id: number;
  name: string;
  category: string;
  categoryId?: number | null;
  image: string;
  description?: string | null;
  vendor?: string | null;
  availability?: string | null;
  warranty?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  status?: string | null;
};

type UiProduct = {
  id: number;
  name: string;
  category: string;
  description: string;
  image: string;
  vendor: string;
  availability: string;
  warranty: string;
  rating: number;
  reviewCount: number;
  status: string;
  photos?: string[];
  price?: string | number | null;
};

const productImages: Record<string, string> = {
  "engine-blade.jpg": engineBlade,
  "hydraulic-pump.jpg": hydraulicPump,
  "landing-gear.jpg": landingGear,
  "avionics-unit.jpg": avionicsUnit,
};

const statusBadge = (status: string) => {
  switch (status) {
    case "available":
      return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="mr-1 h-3 w-3" />Verified Stock</Badge>;
    case "limited":
      return <Badge className="bg-warning text-warning-foreground"><Clock className="mr-1 h-3 w-3" />Limited</Badge>;
    case "preorder":
      return <Badge variant="outline"><AlertTriangle className="mr-1 h-3 w-3" />Lead Time</Badge>;
    default:
      return <Badge variant="secondary">Availability Unknown</Badge>;
  }
};

const Products = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<UiProduct | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", "catalog"],
    queryFn: () => fetchJson<ApiProduct[]>("/api/products"),
    staleTime: 30_000,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchJson<ApiCategory[]>("/api/categories"),
    staleTime: 60_000,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) =>
      fetchJson("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      }),
    onSuccess: () => {
      toast({ title: "Added to cart!" });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resolveImageSrc = (url?: string) => {
    if (!url) return engineBlade;
    if (/^https?:\/\//i.test(url)) return url;
    const key = url.replace(/^\//, '');
    if (productImages[key]) return productImages[key];
    if (url.startsWith('/')) return apiUrl(url);
    return url;
  };

  const [searchParams] = useSearchParams();
  const qParam = (searchParams.get('q') || '').toLowerCase().trim();

  const products = useMemo<UiProduct[]>(() => {
    const raw = (data ?? []) as ApiProduct[];
    let filtered = qParam
      ? raw.filter((p) => {
          const hay = `${p.name} ${p.category} ${p.description ?? ''}`.toLowerCase();
          return hay.includes(qParam);
        })
      : raw;
    // Apply category filter
    if (selectedCategoryId !== null) {
      filtered = filtered.filter((p) => p.categoryId === selectedCategoryId);
    }
    return filtered.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description ?? "Detailed specifications will be shared once the RFQ is initiated.",
      photos: (product as any).photos ?? [],
      image: resolveImageSrc(((product as any).photos && (product as any).photos.length > 0) ? (product as any).photos[0] : product.image),
      price: product.price ?? null,
      vendor: product.vendor ?? "Verified Vendor",
      availability: product.availability && product.availability.length > 0 ? product.availability : "On request",
      warranty: product.warranty ?? "Warranty terms shared during negotiation",
      rating: typeof product.rating === "number" ? product.rating : 4.5,
      reviewCount: typeof product.reviewCount === "number" ? product.reviewCount : 0,
      status: product.status ?? "available",
    }));
  }, [data, qParam, selectedCategoryId]);

  const openQuote = (product: UiProduct) => {
    setSelectedProduct(product);
    setQuoteOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mb-8 sm:mb-12 space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold">Aerospace Parts Catalog</h1>
        <p className="text-muted-foreground text-sm sm:text-lg">
          Search mission-ready components across engines, avionics, landing systems, and mechanical assemblies. All listings are verified and tracked for warranty compliance.
        </p>
      </div>

      {/* Category Filter Bar */}
      {categoriesData && categoriesData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Browse by Category</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategoryId === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategoryId(null)}
            >
              All ({(data ?? []).length})
            </Button>
            {categoriesData.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategoryId === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                {cat.name} ({cat._count?.products ?? cat.productCount})
              </Button>
            ))}
          </div>
        </div>
      )}

      {isLoading && <div><LoadingLogo /></div>}
      {isError && !isLoading && <div className="text-muted-foreground">Unable to load products.</div>}

      {!isLoading && !isError && products.length === 0 && (
        <div className="text-muted-foreground">No products available yet.</div>
      )}

      {!isLoading && !isError && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              onClick={() => navigate(`/products/${product.id}`)}
              role="button"
              className="group h-full overflow-hidden border-primary/10 bg-card/80 hover:border-primary/30 hover:shadow-card transition-all cursor-pointer"
            >
              <div className="relative aspect-video overflow-hidden">
                <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {product.photos && product.photos.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                    +{product.photos.length - 1} more
                  </div>
                )}
              </div>
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs uppercase tracking-wide">
                    {product.category}
                  </Badge>
                  {statusBadge(product.status)}
                </div>
                <CardTitle className="text-xl leading-tight">{product.name}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-primary" />
                  {product.vendor}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p className="line-clamp-4 leading-relaxed text-foreground/80">{product.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center">
                    <Star className="mr-1 h-4 w-4 fill-primary text-primary" />
                    {product.rating.toFixed(1)} ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                  <Badge variant="secondary">{product.availability}</Badge>
                </div>
                <div className="rounded-lg border border-dashed border-primary/30 px-3 py-2 text-xs text-muted-foreground">
                  Warranty: <span className="text-foreground font-medium">{product.warranty}</span>
                </div>
                {product.price && (
                  <p className="text-lg font-bold mt-2">₹{parseFloat(product.price).toLocaleString()}</p>
                )}
                <div className="flex gap-2 pt-2">
                  {user && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); addToCartMutation.mutate(product.id); }}
                      disabled={addToCartMutation.isPending}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openQuote(product); }}>
                    RFQ
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QuoteModal isOpen={quoteOpen} onClose={() => setQuoteOpen(false)} productName={selectedProduct?.name} />
    </div>
  );
};

export default Products;

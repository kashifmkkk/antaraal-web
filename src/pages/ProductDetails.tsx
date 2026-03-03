import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson, apiUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ShieldCheck, Star, Calendar, Package, ShoppingCart } from "lucide-react";
import QuoteModal from "@/components/QuoteModal";
import ReviewsSection from "@/components/ReviewsSection";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import engineBlade from "@/assets/engine-blade.jpg";
import hydraulicPump from "@/assets/hydraulic-pump.jpg";
import landingGear from "@/assets/landing-gear.jpg";
import avionicsUnit from "@/assets/avionics-unit.jpg";

const imageMap: Record<string, string> = {
  "/engine-blade.jpg": engineBlade,
  "/landing-gear.jpg": landingGear,
  "/hydraulic-pump.jpg": hydraulicPump,
  "/avionics-unit.jpg": avionicsUnit,
};

interface ApiProduct {
  id: number;
  name: string;
  category: string;
  image: string;
  photos?: string[];
  price?: string | null;
  description?: string | null;
  vendor?: string | null;
  availability?: string | null;
  warranty?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  warrantyExpiry?: string | null;
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quoteOpen, setQuoteOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    enabled: Boolean(id),
    queryFn: () => fetchJson<ApiProduct>(`/api/products/${id}`),
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
      navigate('/cart?checkout=1');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const product = useMemo(() => {
    if (!data) return null;
    const availability = data.availability && data.availability.length > 0 ? data.availability : "On request";
    const warranty = data.warranty && data.warranty.length > 0 ? data.warranty : "Warranty provided with contract";
    const warrantyExpiry = data.warrantyExpiry ? new Date(data.warrantyExpiry).toLocaleDateString() : "Shared during onboarding";
    const photos = (data.photos ?? []).filter(Boolean);
    const resolveImageSrc = (url?: string) => {
      if (!url) return engineBlade;
      if (/^https?:\/\//i.test(url)) return url;
      if (url.startsWith('/')) return apiUrl(url);
      return url;
    };

    const imageCandidates = photos.length > 0 ? photos : [data.image];

    return {
      ...data,
      availability,
      warranty,
      warrantyExpiry,
      vendor: data.vendor ?? "Verified Vendor",
      rating: typeof data.rating === "number" ? data.rating : 4.6,
      reviewCount: typeof data.reviewCount === "number" ? data.reviewCount : 0,
      description: data.description ?? "Detailed technical specifications will be shared by the vendor once the RFQ is raised.",
      photos: imageCandidates.map(resolveImageSrc),
      imageSrc: resolveImageSrc(imageCandidates[0]),
      price: data.price ?? null,
    };
  }, [data]);

  const [mainImage, setMainImage] = useState<string | undefined>(undefined);
  useMemo(() => setMainImage(product?.imageSrc), [product]);

  return (
    <div className="container mx-auto px-4 py-12">
      <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {isLoading && (
        <div className="grid gap-10 lg:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      )}

      {isError && !isLoading && (
        <Card className="p-8">
          <CardContent>
            <p className="text-muted-foreground">The product could not be found.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && product && (
        <div className="grid gap-12 lg:grid-cols-[2fr_3fr]">
          <Card className="overflow-hidden border-primary/10 bg-card/80">
            <div className="relative">
              <img src={mainImage ?? product.imageSrc} alt={product.name} className="h-full w-full object-cover" />
              {product.photos && product.photos.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded text-sm font-medium">
                  {product.photos.findIndex(p => p === (mainImage ?? product.imageSrc)) + 1} / {product.photos.length}
                </div>
              )}
            </div>
            {product.photos && product.photos.length > 1 && (
              <div className="flex gap-2 p-2">
                {product.photos.map((p, idx) => (
                  <button 
                    key={idx} 
                    type="button" 
                    onClick={() => setMainImage(p)} 
                    className={`w-16 h-12 overflow-hidden rounded border-2 transition-all ${mainImage === p ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'}`}
                  >
                    <img src={p} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          <div className="space-y-8">
            <div className="space-y-3">
              <Badge variant="outline" className="uppercase tracking-wide text-xs">
                {product.category}
              </Badge>
              <h1 className="text-4xl font-semibold text-foreground">{product.name}</h1>
              {product.price && (
                <div className="text-2xl font-bold text-foreground">₹{parseFloat(product.price).toLocaleString()}</div>
              )}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  {product.vendor}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  {product.rating.toFixed(1)} ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="rounded-lg border border-dashed border-primary/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-primary/80">Availability</p>
                  <p className="text-lg font-medium text-foreground">{product.availability}</p>
                </div>
                <div className="rounded-lg border border-dashed border-primary/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-primary/80">Warranty Coverage</p>
                  <p className="text-lg font-medium text-foreground">{product.warranty}</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Expected expiry: {product.warrantyExpiry}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-primary/10 bg-card/70 p-4 text-sm leading-relaxed text-muted-foreground">
                <p>{product.description}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-primary/20 px-3 py-1 text-xs text-primary">
                  <Package className="h-3 w-3" />
                  Traceable lot & paperwork provided with shipment
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="flex-1" onClick={() => setQuoteOpen(true)}>
                Request Quote (RFQ)
              </Button>
              {user && (
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => addToCartMutation.mutate(product.id)}
                  disabled={addToCartMutation.isPending}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                </Button>
              )}
              <Button size="lg" variant="outline" className="flex-1" onClick={() => navigate("/vendors")}>
                Contact Vendor
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !isError && product && id && (
        <div className="mt-12">
          <ReviewsSection productId={id} />
        </div>
      )}

      <QuoteModal isOpen={quoteOpen} onClose={() => setQuoteOpen(false)} productName={product?.name} />
    </div>
  );
};

export default ProductDetails;

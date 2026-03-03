import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Shield, Truck, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  vendor: string;
  price: string;
  availability: string;
  warranty: string;
  rating: number;
  category: string;
  status: string;
  warrantyExpiry: string;
  image: string;
  description: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const ProductModal = ({ isOpen, onClose, product }: ProductModalProps) => {
  const { toast } = useToast();

  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) =>
      fetchJson("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Added to cart" });
    },
    onError: (err: Error) => {
      toast({ title: "Add failed", description: err.message, variant: "destructive" });
    },
  });

  if (!product) return null;

  const handleAddToCart = async () => {
    if (!user) return navigate('/login');
    await addToCartMutation.mutateAsync(product.id);
    onClose();
  };

  const handleBuyNow = async () => {
    if (!user) return navigate('/login');
    await addToCartMutation.mutateAsync(product.id);
    onClose();
    navigate('/cart?checkout=1');
  };

  const handleRequestQuote = () => {
    toast({
      title: "Quote Requested",
      description: `Quote request sent to ${product.vendor}. You'll receive a response within 24 hours.`,
    });
    onClose();
  };

  const handleContactVendor = () => {
    toast({
      title: "Connecting to Vendor",
      description: `Opening direct chat with ${product.vendor}`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
          <DialogDescription>
            by {product.vendor} • Category: {product.category}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <img src={product.image} alt="View 1" className="aspect-square object-cover rounded border opacity-70 hover:opacity-100 cursor-pointer" />
              <img src={product.image} alt="View 2" className="aspect-square object-cover rounded border opacity-70 hover:opacity-100 cursor-pointer" />
              <img src={product.image} alt="View 3" className="aspect-square object-cover rounded border opacity-70 hover:opacity-100 cursor-pointer" />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{product.category}</Badge>
                <Badge className={
                  product.status === 'available' ? 'bg-success text-success-foreground' : 
                  product.status === 'limited' ? 'bg-warning text-warning-foreground' : 
                  'bg-secondary'
                }>
                  {product.availability}
                </Badge>
              </div>
              
              <p className="text-muted-foreground mb-4">{product.description}</p>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="text-3xl font-bold text-primary">{product.price}</div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 fill-primary text-primary mr-1" />
                  <span className="font-semibold">{product.rating}</span>
                  <span className="text-muted-foreground ml-1">(127 reviews)</span>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Specifications</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Availability:</span>
                  <span className="font-medium">{product.availability}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Warranty:</span>
                  <span className="font-medium">{product.warranty}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Warranty Expires:</span>
                  <span className="font-medium">{product.warrantyExpiry}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Certification:</span>
                  <span className="font-medium">EASA Part 145</span>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Technical Details</h3>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Part Number:</span>
                  <span className="font-mono">CFM56-7B-001-XY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material:</span>
                  <span>Titanium Alloy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight:</span>
                  <span>2.5 kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Compatibility:</span>
                  <span>CFM56-7B Series</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button className="flex-1" onClick={handleAddToCart} disabled={addToCartMutation.isPending}>
                  {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                </Button>
                <Button variant="secondary" className="flex-1" onClick={handleBuyNow} disabled={addToCartMutation.isPending}>
                  Buy Now
                </Button>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleRequestQuote}>
                  Request Quote
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex-1"
                  onClick={handleContactVendor}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Vendor Directly
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
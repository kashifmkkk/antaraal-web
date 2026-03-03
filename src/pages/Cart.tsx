import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson, apiUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ShoppingCart, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import engineBlade from "@/assets/engine-blade.jpg";
import hydraulicPump from "@/assets/hydraulic-pump.jpg";
import landingGear from "@/assets/landing-gear.jpg";
import avionicsUnit from "@/assets/avionics-unit.jpg";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CartItem = {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: string;
    image: string;
    availability: string;
  };
};

const Cart = () => {
  const { user, loading, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => fetchJson<CartItem[]>("/api/cart"),
    enabled: !!user && !!token,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) =>
      fetchJson(`/api/cart/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Cart updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: number) =>
      fetchJson(`/api/cart/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Item removed from cart" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () =>
      fetchJson("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          shippingAddress,
          billingAddress,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Order placed successfully!" });
      setCheckoutOpen(false);
      navigate("/account?tab=orders");
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () =>
      fetchJson('/api/cart/clear', {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({ title: 'Cart cleared' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to clear cart', description: error.message, variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (searchParams.get('checkout') === '1') {
      setCheckoutOpen(true);
      // remove the flag from the URL
      const next = new URLSearchParams(searchParams.toString());
      next.delete('checkout');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  const totalAmount = cartItems?.reduce((sum, item) => {
    const price = parseFloat(item.product.price || "0");
    return sum + price * item.quantity;
  }, 0) || 0;

  const productImages: Record<string, string> = {
    "engine-blade.jpg": engineBlade,
    "hydraulic-pump.jpg": hydraulicPump,
    "landing-gear.jpg": landingGear,
    "avionics-unit.jpg": avionicsUnit,
  };

  const resolveImageSrc = (url?: string) => {
    if (!url) return engineBlade;
    if (/^https?:\/\//i.test(url)) return url;
    const key = url.replace(/^\//, '');
    if (productImages[key]) return productImages[key];
    if (url.startsWith('/')) return apiUrl(url);
    return url;
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
      </div>

      {loading || isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          {!cartItems || cartItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mb-4">Your cart is empty</p>
                <Button onClick={() => navigate("/products")}>Browse Products</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <img
                          src={resolveImageSrc(item.product.image)}
                          alt={item.product.name}
                          className="w-24 h-24 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.product.availability}
                          </p>
                          <p className="text-lg font-bold mt-2">
                            ₹{parseFloat(item.product.price || "0").toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItemMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateQuantityMutation.mutate({
                                  id: item.id,
                                  quantity: Math.max(1, item.quantity - 1),
                                })
                              }
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateQuantityMutation.mutate({
                                  id: item.id,
                                  quantity: item.quantity + 1,
                                })
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>₹{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (18% GST)</span>
                      <span>₹{(totalAmount * 0.18).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>₹{(totalAmount * 1.18).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => setCheckoutOpen(true)}
                    >
                      Proceed to Checkout
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      size="sm"
                      onClick={() => {
                        if (!confirm('Are you sure you want to clear your cart?')) return;
                        clearCartMutation.mutate();
                      }}
                      disabled={clearCartMutation.isPending}
                    >
                      {clearCartMutation.isPending ? 'Clearing...' : 'Clear Cart'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              Enter your shipping and billing information to complete your order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipping">Shipping Address</Label>
              <Textarea
                id="shipping"
                placeholder="Enter your shipping address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing">Billing Address</Label>
              <Textarea
                id="billing"
                placeholder="Enter your billing address (or same as shipping)"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-between text-lg font-bold pt-4 border-t">
              <span>Total Amount:</span>
              <span>₹{(totalAmount * 1.18).toLocaleString()}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => checkoutMutation.mutate()}
              disabled={!shippingAddress || checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? "Processing..." : "Place Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cart;

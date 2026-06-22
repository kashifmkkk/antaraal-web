import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface PendingProduct {
  id: number;
  name: string;
  category: string;
  image: string;
  price: string | number | null;
  description?: string | null;
  vendor?: string | null;
  status: string;
  createdAt: string;
}

export default function ApproveProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", "pending"],
    queryFn: async () => {
      const all = await fetchJson<PendingProduct[]>("/api/products");
      return all.filter(p => p.status === "pending");
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (productId: number) =>
      fetchJson(`/api/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "active" }),
      }),
    onSuccess: () => {
      toast({ title: "Product approved!", description: "It's now visible to customers." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setApprovingId(null);
    },
    onError: (error) => {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (productId: number) =>
      fetchJson(`/api/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected" }),
      }),
    onSuccess: () => {
      toast({ title: "Product rejected", description: "Vendor will be notified." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setRejectingId(null);
    },
    onError: (error) => {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Product Approvals</h1>
        <p className="text-muted-foreground">Review and approve vendor-submitted products ({products.length} pending)</p>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pending products to approve</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Product Image */}
                  <div className="md:col-span-1 flex items-center justify-center bg-muted rounded">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="h-24 w-24 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="md:col-span-3">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Vendor:</span>
                          <p className="font-medium">{product.vendor || "Unknown"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price:</span>
                          <p className="font-medium">
                            {product.price ? `₹${Number(product.price).toLocaleString()}` : "On Request"}
                          </p>
                        </div>
                      </div>

                      {product.description && (
                        <div>
                          <span className="text-sm text-muted-foreground">Description:</span>
                          <p className="text-sm line-clamp-2">{product.description}</p>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Submitted: {new Date(product.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="md:col-span-1 flex flex-col gap-2 justify-center">
                    <Button
                      onClick={() => {
                        setApprovingId(product.id);
                        approveMutation.mutate(product.id);
                      }}
                      disabled={approvingId === product.id || rejectingId === product.id}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      {approvingId === product.id ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      onClick={() => {
                        setRejectingId(product.id);
                        rejectMutation.mutate(product.id);
                      }}
                      disabled={approvingId === product.id || rejectingId === product.id}
                      variant="destructive"
                      size="sm"
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      {rejectingId === product.id ? "Rejecting..." : "Reject"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

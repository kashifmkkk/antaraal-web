import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { User, Package, ShieldCheck, FileText } from "lucide-react";

type Order = {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{
    id: number;
    quantity: number;
    price: number;
    productId: number;
  }>;
};

type WarrantyRecord = {
  id: number;
  productName: string;
  vendor: string;
  tailNumber?: string;
  expiryDate: string;
  status: string;
};

type WarrantyClaim = {
  id: number;
  subject: string;
  description: string;
  status: string;
  response?: string;
  createdAt: string;
  productId: number;
};

const AccountPage = () => {
  const { user, loading, logout, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [newClaim, setNewClaim] = useState({
    productId: "",
    subject: "",
    description: "",
  });

  const tabListClassName = "grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-0 overflow-x-auto";

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchJson<Order[]>("/api/orders"),
    enabled: !!user && !!token && activeTab === "orders",
  });

  const { data: warranties, isLoading: warrantiesLoading } = useQuery({
    queryKey: ["user-warranties"],
    queryFn: () => fetchJson<WarrantyRecord[]>("/api/warranties/my"),
    enabled: !!user && !!token && activeTab === "warranties",
  });

  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ["warranty-claims"],
    queryFn: () => fetchJson<WarrantyClaim[]>("/api/warranty-claims"),
    enabled: !!user && !!token && activeTab === "claims",
  });

  const createClaimMutation = useMutation({
    mutationFn: async () =>
      fetchJson("/api/warranty-claims", {
        method: "POST",
        body: JSON.stringify(newClaim),
      }),
    onSuccess: () => {
      toast({ title: "Warranty claim submitted successfully" });
      setClaimDialogOpen(false);
      setNewClaim({ productId: "", subject: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["warranty-claims"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit claim",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-6">
        <User className="h-8 w-8 text-primary" />
        <h1 className="text-2xl sm:text-3xl font-bold">My Account</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={tabListClassName}>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="warranties">Warranties</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Manage your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="text-lg font-medium">{user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-lg font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge variant="secondary">{user?.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={user?.isActive ? "default" : "destructive"}>
                      {user?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="pt-4 border-t flex gap-2">
                  {user?.role === 'VENDOR' && (
                    <Button variant="outline" onClick={() => navigate('/vendor/submit-product')}>
                      Submit Product
                    </Button>
                  )}
                  <Button variant="destructive" onClick={logout}>
                    Log out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order History
                    </CardTitle>
                    <CardDescription>View your past orders and status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : !orders || orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No orders yet</p>
                ) : (
                  <>
                    <div className="space-y-3 md:hidden">
                      {orders.map((order) => (
                        <Card key={order.id} className="p-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-mono text-xs">{order.orderNumber}</span>
                              <Badge variant="outline">{order.status}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Date</span>
                              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Items</span>
                              <span>{order.items?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Total</span>
                              <span>₹{order.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Payment</span>
                              <Badge
                                variant={
                                  order.paymentStatus === "Paid"
                                    ? "default"
                                    : order.paymentStatus === "Pending"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {order.paymentStatus}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <div className="hidden md:block">
                      <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{order.items?.length || 0}</TableCell>
                          <TableCell>₹{order.totalAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.paymentStatus === "Paid"
                                  ? "default"
                                  : order.paymentStatus === "Pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {order.paymentStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="warranties">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5" />
                      My Warranties
                    </CardTitle>
                    <CardDescription>Active warranty coverage for your products</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {warrantiesLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : !warranties || warranties.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No warranties found</p>
                ) : (
                  <>
                    <div className="space-y-3 md:hidden">
                      {warranties.map((warranty) => (
                        <Card key={warranty.id} className="p-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium">{warranty.productName}</span>
                              <Badge
                                variant={
                                  warranty.status === "Active"
                                    ? "default"
                                    : warranty.status === "Expiring"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {warranty.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Vendor</span>
                              <span className="text-right">{warranty.vendor}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Tail Number</span>
                              <span>{warranty.tailNumber || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Expiry</span>
                              <span>{new Date(warranty.expiryDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <div className="hidden md:block">
                      <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Tail Number</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warranties.map((warranty) => (
                        <TableRow key={warranty.id}>
                          <TableCell>{warranty.productName}</TableCell>
                          <TableCell>{warranty.vendor}</TableCell>
                          <TableCell>{warranty.tailNumber || "—"}</TableCell>
                          <TableCell>{new Date(warranty.expiryDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                warranty.status === "Active"
                                  ? "default"
                                  : warranty.status === "Expiring"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {warranty.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Warranty Claims
                    </CardTitle>
                    <CardDescription>Submit and track warranty claims</CardDescription>
                  </div>
                  <Button className="w-full sm:w-auto" onClick={() => setClaimDialogOpen(true)}>New Claim</Button>
                </div>
              </CardHeader>
              <CardContent>
                {claimsLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : !claims || claims.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No warranty claims yet</p>
                ) : (
                  <>
                    <div className="space-y-3 md:hidden">
                      {claims.map((claim) => (
                        <Card key={claim.id} className="p-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium">{claim.subject}</span>
                              <Badge
                                variant={
                                  claim.status === "Approved"
                                    ? "default"
                                    : claim.status === "Pending"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {claim.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Product</span>
                              <span>#{claim.productId}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Date</span>
                              <span>{new Date(claim.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="text-muted-foreground">
                              <span className="block text-xs uppercase tracking-wide mb-1">Response</span>
                              <span className="text-sm">{claim.response || "—"}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <div className="hidden md:block">
                      <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Product ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Response</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell className="font-medium">{claim.subject}</TableCell>
                          <TableCell>#{claim.productId}</TableCell>
                          <TableCell>{new Date(claim.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                claim.status === "Approved"
                                  ? "default"
                                  : claim.status === "Pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {claim.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {claim.response || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-lg sm:w-full">
          <DialogHeader>
            <DialogTitle>Submit Warranty Claim</DialogTitle>
            <DialogDescription>
              Provide details about your warranty claim and we'll review it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Product ID</Label>
              <Input
                id="productId"
                type="number"
                placeholder="Enter product ID"
                value={newClaim.productId}
                onChange={(e) => setNewClaim({ ...newClaim, productId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief description of the issue"
                value={newClaim.subject}
                onChange={(e) => setNewClaim({ ...newClaim, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the warranty claim"
                value={newClaim.description}
                onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createClaimMutation.mutate()}
              disabled={
                !newClaim.productId ||
                !newClaim.subject ||
                createClaimMutation.isPending
              }
            >
              {createClaimMutation.isPending ? "Submitting..." : "Submit Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountPage;

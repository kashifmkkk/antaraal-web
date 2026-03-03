import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Eye } from "lucide-react";

type Order = {
  id: number;
  orderNumber: string;
  userId: number;
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  shippingAddress?: string;
  billingAddress?: string;
  paymentMethod?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  items: Array<{
    id: number;
    quantity: number;
    price: number;
    productId: number;
  }>;
};

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Pending: "secondary",
  Processing: "outline",
  Shipped: "default",
  Delivered: "default",
  Cancelled: "destructive",
};

const paymentStatusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Pending: "secondary",
  Paid: "default",
  Failed: "destructive",
  Refunded: "outline",
};

const Orders = () => {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updatePaymentStatus, setUpdatePaymentStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () =>
      fetchJson<Order[]>("/api/admin/orders", {
        headers: authHeaders,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      paymentStatus,
      trackingNumber,
      shippingCarrier,
    }: {
      id: number;
      status?: string;
      paymentStatus?: string;
      trackingNumber?: string;
      shippingCarrier?: string;
    }) =>
      fetchJson(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status, paymentStatus, trackingNumber, shippingCarrier }),
      }),
    onSuccess: () => {
      toast({ title: "Order updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      setDetailsOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setUpdateStatus(order.status);
    setUpdatePaymentStatus(order.paymentStatus);
    setTrackingNumber(order.trackingNumber || "");
    setShippingCarrier(order.shippingCarrier || "");
    setDetailsOpen(true);
  };

  const handleUpdate = () => {
    if (selectedOrder) {
      updateMutation.mutate({
        id: selectedOrder.id,
        status: updateStatus,
        paymentStatus: updatePaymentStatus,
        trackingNumber: trackingNumber || undefined,
        shippingCarrier: shippingCarrier || undefined,
      });
    }
  };

  const stats = useMemo(() => {
    if (!data) return { total: 0, pending: 0, completed: 0, revenue: 0 };
    return {
      total: data.length,
      pending: data.filter((o) => o.status === "Pending" || o.status === "Processing").length,
      completed: data.filter((o) => o.status === "Delivered").length,
      revenue: data.reduce((sum, o) => sum + o.totalAmount, 0),
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          <Package className="h-8 w-8" />
          Order Management
        </h1>
        <p className="text-sm text-muted-foreground">Track and manage customer orders</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading orders…</p>}
          {isError && <p className="text-sm text-destructive">Unable to load orders.</p>}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                      <TableCell>#{order.userId}</TableCell>
                      <TableCell>{order.items?.length || 0}</TableCell>
                      <TableCell className="font-medium">
                        {order.currency} {order.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[order.status] || "outline"}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentStatusVariant[order.paymentStatus] || "outline"}>
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <p className="font-medium">#{selectedOrder.userId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order Date</Label>
                  <p className="font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Amount</Label>
                  <p className="font-medium text-lg">
                    {selectedOrder.currency} {selectedOrder.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Method</Label>
                  <p className="font-medium">{selectedOrder.paymentMethod || "—"}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Shipping Address</Label>
                <p className="text-sm">{selectedOrder.shippingAddress || "—"}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Billing Address</Label>
                <p className="text-sm">{selectedOrder.billingAddress || "—"}</p>
              </div>

              {(selectedOrder.trackingNumber || selectedOrder.shippingCarrier) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedOrder.trackingNumber && (
                    <div>
                      <Label className="text-muted-foreground">Tracking Number</Label>
                      <p className="font-mono text-sm">{selectedOrder.trackingNumber}</p>
                    </div>
                  )}
                  {selectedOrder.shippingCarrier && (
                    <div>
                      <Label className="text-muted-foreground">Shipping Carrier</Label>
                      <p className="text-sm">{selectedOrder.shippingCarrier}</p>
                    </div>
                  )}
                </div>
              )}

              {(selectedOrder.shippedAt || selectedOrder.deliveredAt) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedOrder.shippedAt && (
                    <div>
                      <Label className="text-muted-foreground">Shipped At</Label>
                      <p className="text-sm">{new Date(selectedOrder.shippedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedOrder.deliveredAt && (
                    <div>
                      <Label className="text-muted-foreground">Delivered At</Label>
                      <p className="text-sm">{new Date(selectedOrder.deliveredAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Items ({selectedOrder.items?.length || 0})</Label>
                <div className="mt-2 border rounded-lg p-3 space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>Product #{item.productId} × {item.quantity}</span>
                      <span className="font-medium">₹{item.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Order Status</Label>
                  <Select value={updateStatus} onValueChange={setUpdateStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select value={updatePaymentStatus} onValueChange={setUpdatePaymentStatus}>
                    <SelectTrigger id="paymentStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                      <SelectItem value="Refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trackingNumber">Tracking Number</Label>
                  <Input
                    id="trackingNumber"
                    placeholder="Enter tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingCarrier">Shipping Carrier</Label>
                  <Input
                    id="shippingCarrier"
                    placeholder="e.g., FedEx, UPS, DHL"
                    value={shippingCarrier}
                    onChange={(e) => setShippingCarrier(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;

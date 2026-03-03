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
import { Textarea } from "@/components/ui/textarea";
import { FileText, Eye } from "lucide-react";

type WarrantyClaim = {
  id: number;
  userId: number;
  productId: number;
  recordId?: number;
  subject: string;
  description?: string;
  status: string;
  response?: string;
  createdAt: string;
  updatedAt: string;
};

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Pending: "secondary",
  Approved: "default",
  Rejected: "destructive",
  UnderReview: "outline",
};

const WarrantyClaims = () => {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [response, setResponse] = useState("");

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "warranty-claims"],
    queryFn: () =>
      fetchJson<WarrantyClaim[]>("/api/admin/warranty-claims", {
        headers: authHeaders,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      response,
    }: {
      id: number;
      status: string;
      response: string;
    }) =>
      fetchJson(`/api/admin/warranty-claims/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status, response }),
      }),
    onSuccess: () => {
      toast({ title: "Claim updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin", "warranty-claims"] });
      setDetailsOpen(false);
      setSelectedClaim(null);
      setResponse("");
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (claim: WarrantyClaim) => {
    setSelectedClaim(claim);
    setUpdateStatus(claim.status);
    setResponse(claim.response || "");
    setDetailsOpen(true);
  };

  const handleUpdate = () => {
    if (selectedClaim) {
      updateMutation.mutate({
        id: selectedClaim.id,
        status: updateStatus,
        response: response,
      });
    }
  };

  const stats = useMemo(() => {
    if (!data) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    return {
      total: data.length,
      pending: data.filter((c) => c.status === "Pending" || c.status === "UnderReview").length,
      approved: data.filter((c) => c.status === "Approved").length,
      rejected: data.filter((c) => c.status === "Rejected").length,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Warranty Claims
        </h1>
        <p className="text-sm text-muted-foreground">Review and respond to customer warranty claims</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">All Warranty Claims</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading claims…</p>}
          {isError && <p className="text-sm text-destructive">Unable to load claims.</p>}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-mono text-xs">#{claim.id}</TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {claim.subject}
                      </TableCell>
                      <TableCell>#{claim.userId}</TableCell>
                      <TableCell>#{claim.productId}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[claim.status] || "outline"}>
                          {claim.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(claim)}
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
            <DialogTitle>Warranty Claim Details</DialogTitle>
            <DialogDescription>Claim #{selectedClaim?.id}</DialogDescription>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <p className="font-medium">#{selectedClaim.userId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product ID</Label>
                  <p className="font-medium">#{selectedClaim.productId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Warranty Record ID</Label>
                  <p className="font-medium">
                    {selectedClaim.recordId ? `#${selectedClaim.recordId}` : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p className="font-medium">
                    {new Date(selectedClaim.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Subject</Label>
                <p className="font-medium">{selectedClaim.subject}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm whitespace-pre-wrap">
                  {selectedClaim.description || "No description provided"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={updateStatus} onValueChange={setUpdateStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="UnderReview">Under Review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="response">Admin Response</Label>
                <Textarea
                  id="response"
                  placeholder="Enter response to the customer..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarrantyClaims;

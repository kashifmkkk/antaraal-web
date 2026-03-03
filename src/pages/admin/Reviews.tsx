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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchJson } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Star, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react";

type Review = {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const Reviews = () => {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "reviews", statusFilter],
    queryFn: () => {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      return fetchJson<Review[]>(`/api/admin/reviews${params}`, {
        headers: authHeaders,
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) =>
      fetchJson(`/api/admin/reviews/${id}/approve`, {
        method: "PATCH",
        headers: authHeaders,
      }),
    onSuccess: () => {
      toast({ title: "Review approved" });
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approve failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) =>
      fetchJson(`/api/admin/reviews/${id}/reject`, {
        method: "PATCH",
        headers: authHeaders,
      }),
    onSuccess: () => {
      toast({ title: "Review rejected" });
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Reject failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      fetchJson(`/api/admin/reviews/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      }),
    onSuccess: () => {
      toast({ title: "Review deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stats = useMemo(() => {
    if (!data) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    return {
      total: data.length,
      pending: data.filter((r) => r.status === "Pending").length,
      approved: data.filter((r) => r.status === "Approved").length,
      rejected: data.filter((r) => r.status === "Rejected").length,
    };
  }, [data]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          <Star className="h-8 w-8" />
          Review Moderation
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage and moderate product reviews
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
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
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Reviews</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading reviews…</p>}
          {isError && <p className="text-sm text-destructive">Unable to load reviews.</p>}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-mono">#{review.productId}</TableCell>
                      <TableCell>{review.userName}</TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate">{review.comment || "—"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            review.status === "Approved"
                              ? "default"
                              : review.status === "Pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {review.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {review.status !== "Approved" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => approveMutation.mutate(review.id)}
                              disabled={approveMutation.isPending}
                            >
                              <ThumbsUp className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {review.status !== "Rejected" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => rejectMutation.mutate(review.id)}
                              disabled={rejectMutation.isPending}
                            >
                              <ThumbsDown className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Delete this review?")) {
                                deleteMutation.mutate(review.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reviews;

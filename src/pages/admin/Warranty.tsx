import { useMemo } from "react";
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

type WarrantyRecord = {
  id: string;
  productName: string;
  vendor: string;
  tailNumber?: string | null;
  expiryDate: string;
  status: "Active" | "Expiring" | "Expired";
};

const statusVariant: Record<WarrantyRecord["status"], "secondary" | "outline" | "destructive"> = {
  Active: "secondary",
  Expiring: "outline",
  Expired: "destructive",
};

const Warranty = () => {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "warranty"],
    queryFn: () =>
      fetchJson<WarrantyRecord[]>("/api/admin/warranty", {
        headers: authHeaders,
      }),
  });

  const mutation = useMutation({
    mutationFn: async (record: WarrantyRecord) =>
      fetchJson<WarrantyRecord>(`/api/admin/warranty/${record.id}/refresh`, {
        method: "POST",
        headers: authHeaders,
      }),
    onSuccess: () => {
      toast({ title: "Warranty reminder sent" });
      queryClient.invalidateQueries({ queryKey: ["admin", "warranty"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Reminder failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Warranty tracking</h1>
        <p className="text-sm text-muted-foreground">Stay ahead of expiring coverage across fleet components.</p>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Warranty register</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading warranties…</p>}
          {isError && <p className="text-sm text-destructive">Unable to load warranties.</p>}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Tail Number</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{record.id}</TableCell>
                      <TableCell>{record.productName}</TableCell>
                      <TableCell>{record.vendor}</TableCell>
                      <TableCell>{record.tailNumber ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(record.expiryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[record.status]}>{record.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => mutation.mutate(record)}
                          disabled={mutation.isPending}
                        >
                          Send reminder
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        No warranty records yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Warranty;

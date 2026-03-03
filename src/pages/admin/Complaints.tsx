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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchJson } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["New", "In Review", "Resolved", "Closed"] as const;

type Complaint = {
  id: number;
  subject: string;
  status: (typeof STATUSES)[number];
  product: string;
  vendor: string;
  createdAt: string;
  updatedAt: string;
};

const Complaints = () => {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "complaints"],
    queryFn: () =>
      fetchJson<Complaint[]>("/api/admin/complaints", {
        headers: authHeaders,
      }),
  });

  const mutation = useMutation({
    mutationFn: async ({ complaint, status }: { complaint: Complaint; status: Complaint["status"] }) =>
      fetchJson(`/api/admin/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast({ title: "Complaint updated" });
      queryClient.invalidateQueries({ queryKey: ["admin", "complaints"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to update complaint",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Complaints</h1>
        <p className="text-sm text-muted-foreground">Monitor non-conformances and close the loop with vendors.</p>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Active complaints</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading complaints…</p>}
          {isError && <p className="text-sm text-destructive">Unable to load complaint registry.</p>}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Logged</TableHead>
                    <TableHead className="text-right">Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">{complaint.subject}</TableCell>
                      <TableCell>{complaint.product}</TableCell>
                      <TableCell>{complaint.vendor}</TableCell>
                      <TableCell>
                        <Badge variant={complaint.status === "Closed" ? "outline" : complaint.status === "Resolved" ? "secondary" : "destructive"}>
                          {complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={complaint.status}
                          onValueChange={(value) =>
                            mutation.mutate({ complaint, status: value as Complaint["status"] })
                          }
                          disabled={mutation.isPending}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        No complaints logged.
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

export default Complaints;

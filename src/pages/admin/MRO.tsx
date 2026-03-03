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

const mroStatuses = ["Scheduled", "In Progress", "Awaiting Approval", "Released"] as const;

type MroOrder = {
  id: string;
  tailNumber: string;
  provider: string;
  serviceType: string;
  status: (typeof mroStatuses)[number];
  estimatedTatDays: number;
  startDate: string;
};

const MRO = () => {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "mro"],
    queryFn: () =>
      fetchJson<MroOrder[]>("/api/admin/mro", {
        headers: authHeaders,
      }),
  });

  const mutation = useMutation({
    mutationFn: async ({ order, status }: { order: MroOrder; status: MroOrder["status"]; }) =>
      fetchJson<MroOrder>(`/api/admin/mro/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast({ title: "MRO order updated" });
      queryClient.invalidateQueries({ queryKey: ["admin", "mro"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to update MRO",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Overhaul / MRO</h1>
        <p className="text-sm text-muted-foreground">Coordinate shop visits and keep turnaround aligned with fleet plans.</p>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Active work scopes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading work orders…</p>}
          {isError && <p className="text-sm text-destructive">Unable to load MRO data.</p>}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Tail Number</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Est. TAT</TableHead>
                    <TableHead className="text-right">Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{order.id}</TableCell>
                      <TableCell>{order.tailNumber}</TableCell>
                      <TableCell>{order.provider}</TableCell>
                      <TableCell>{order.serviceType}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{order.estimatedTatDays} days</TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            mutation.mutate({ order, status: value as MroOrder["status"] })
                          }
                          disabled={mutation.isPending}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {mroStatuses.map((status) => (
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
                      <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                        No overhaul projects in queue.
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

export default MRO;

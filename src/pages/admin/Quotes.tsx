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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchJson } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";

const quoteStatuses = ["Draft", "Sent", "Accepted", "Declined"] as const;

type Quote = {
  id: string;
  rfqId: string;
  vendor: string;
  totalValue: number;
  currency: string;
  status: (typeof quoteStatuses)[number];
  issuedAt: string;
  validUntil: string;
};

const Quotes = () => {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "quotes"],
    queryFn: () =>
      fetchJson<Quote[]>("/api/admin/quotes", {
        headers: authHeaders,
      }),
  });

  const mutation = useMutation({
    mutationFn: async ({ quote, status }: { quote: Quote; status: Quote["status"]; }) =>
      fetchJson<Quote>(`/api/admin/quotes/${quote.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast({ title: "Quote status updated" });
      queryClient.invalidateQueries({ queryKey: ["admin", "quotes"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to update quote",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Quotes</h1>
        <p className="text-sm text-muted-foreground">Monitor vendor proposals and convert RFQs.</p>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Quote activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading quotes…</p>}
          {isError && <p className="text-sm text-destructive">Unable to load quotes.</p>}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote ID</TableHead>
                    <TableHead>RFQ</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead className="text-right">Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{quote.id}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{quote.rfqId}</TableCell>
                      <TableCell>{quote.vendor}</TableCell>
                      <TableCell>
                        {quote.currency} {quote.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{quote.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(quote.validUntil).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={quote.status}
                          onValueChange={(value) =>
                            mutation.mutate({ quote, status: value as Quote["status"] })
                          }
                          disabled={mutation.isPending}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {quoteStatuses.map((status) => (
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
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        No quotes issued yet.
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

export default Quotes;

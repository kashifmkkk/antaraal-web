import { FormEvent, useMemo, useState } from "react";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJson } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";

const rfqStatuses = ["New", "In Review", "Quoted", "Closed"] as const;

type Rfq = {
  id: string;
  productName: string;
  quantity: number;
  buyerName: string;
  buyerCompany: string;
  buyerEmail: string;
  status: (typeof rfqStatuses)[number];
  notes?: string;
  assignedVendor?: string | null;
  createdAt: string;
};

type UpdatePayload = {
  status: (typeof rfqStatuses)[number];
  assignedVendor?: string;
  internalNotes?: string;
};

const RFQs = () => {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Rfq | null>(null);
  const [formState, setFormState] = useState<UpdatePayload>({ status: "New", assignedVendor: "", internalNotes: "" });

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "rfqs"],
    queryFn: () =>
      fetchJson<Rfq[]>("/api/admin/rfqs", {
        headers: authHeaders,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ rfq, payload }: { rfq: Rfq; payload: UpdatePayload }) =>
      fetchJson<Rfq>(`/api/admin/rfqs/${rfq.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast({ title: "RFQ updated" });
      queryClient.invalidateQueries({ queryKey: ["admin", "rfqs"] });
      setSelected(null);
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to update RFQ",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const openDialog = (rfq: Rfq) => {
    setSelected(rfq);
    setFormState({
      status: rfq.status,
      assignedVendor: rfq.assignedVendor ?? "",
      internalNotes: "",
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) {
      return;
    }
    updateMutation.mutate({
      rfq: selected,
      payload: {
        status: formState.status,
        assignedVendor: formState.assignedVendor || undefined,
        internalNotes: formState.internalNotes?.trim() ? formState.internalNotes.trim() : undefined,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">RFQs</h1>
        <p className="text-sm text-muted-foreground">Track inbound requests and coordinate vendor responses.</p>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Incoming RFQs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading RFQs…</p>}
          {isError && <p className="text-sm text-destructive">Unable to load RFQs.</p>}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFQ ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Vendor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((rfq) => (
                    <TableRow key={rfq.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{rfq.id}</TableCell>
                      <TableCell>{rfq.productName}</TableCell>
                      <TableCell>{rfq.quantity}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{rfq.buyerName}</p>
                          <p className="text-xs text-muted-foreground">{rfq.buyerCompany}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rfq.status}</Badge>
                      </TableCell>
                      <TableCell>{rfq.assignedVendor ?? "—"}</TableCell>
                      <TableCell className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openDialog(rfq)}>
                          View / Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        No RFQs received yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={selected !== null} onOpenChange={(open) => (!open ? setSelected(null) : undefined)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update RFQ</DialogTitle>
          </DialogHeader>
          {selected && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Buyer</Label>
                <p className="text-sm text-muted-foreground">
                  {selected.buyerName} • {selected.buyerCompany} • {selected.buyerEmail}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formState.status}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, status: value as UpdatePayload["status"] }))
                    }
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {rfqStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assigned vendor</Label>
                  <Input
                    value={formState.assignedVendor ?? ""}
                    onChange={(event) => setFormState((prev) => ({ ...prev, assignedVendor: event.target.value }))}
                    placeholder="Enter vendor name"
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Internal notes</Label>
                <Textarea
                  value={formState.internalNotes ?? ""}
                  onChange={(event) => setFormState((prev) => ({ ...prev, internalNotes: event.target.value }))}
                  placeholder="Enter coordination notes for teammates"
                  rows={4}
                  disabled={updateMutation.isPending}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setSelected(null)} disabled={updateMutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RFQs;

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
import { fetchJson, apiUrl } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";

type Vendor = {
  id: string;
  name: string;
  location: string;
  specialty: string;
  verificationStatus: "Verified" | "Pending" | "Rejected";
  isActive: boolean;
};

const verificationVariants: Record<Vendor["verificationStatus"], "secondary" | "outline" | "destructive"> = {
  Verified: "secondary",
  Pending: "outline",
  Rejected: "destructive",
};

const Vendors = () => {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const { data, isError, isLoading } = useQuery({
    queryKey: ["admin", "vendors"],
    queryFn: () =>
      fetchJson<Vendor[]>("/api/admin/vendors", {
        headers: authHeaders,
      }),
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ vendor, status }: { vendor: Vendor; status: Vendor["verificationStatus"]; }) =>
      fetchJson<Vendor>(`/api/admin/vendors/${vendor.id}/verification`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_, { status }) => {
      toast({ title: status === "Verified" ? "Vendor verified" : "Vendor marked" });
      queryClient.invalidateQueries({ queryKey: ["admin", "vendors"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (vendor: Vendor) => {
      await fetch(apiUrl(`/api/admin/vendors/${vendor.id}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify({ isActive: !vendor.isActive }),
      });
    },
    onSuccess: () => {
      toast({ title: "Vendor status updated" });
      queryClient.invalidateQueries({ queryKey: ["admin", "vendors"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Status update failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Vendors</h1>
        <p className="text-sm text-muted-foreground">Control onboarding, verification, and activation.</p>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Vendor registry</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading vendors…</p>}
          {isError && <p className="text-sm text-destructive">Unable to load vendor list.</p>}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>{vendor.location}</TableCell>
                      <TableCell>{vendor.specialty}</TableCell>
                      <TableCell>
                        <Badge variant={verificationVariants[vendor.verificationStatus]}>{vendor.verificationStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={vendor.isActive ? "secondary" : "outline"}>{vendor.isActive ? "Active" : "Disabled"}</Badge>
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            verifyMutation.mutate({
                              vendor,
                              status: vendor.verificationStatus === "Verified" ? "Pending" : "Verified",
                            })
                          }
                          disabled={verifyMutation.isPending}
                        >
                          {vendor.verificationStatus === "Verified" ? "Unverify" : "Verify"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActiveMutation.mutate(vendor)}
                          disabled={toggleActiveMutation.isPending}
                        >
                          {vendor.isActive ? "Disable" : "Enable"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        No vendors onboarded yet.
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

export default Vendors;

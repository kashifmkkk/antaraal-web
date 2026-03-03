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
import { fetchJson, apiUrl } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";

const roles = ["ADMIN", "VENDOR", "BUYER"] as const;

type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  role: (typeof roles)[number];
  isActive: boolean;
  lastActiveAt: string;
};

const Users = () => {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () =>
      fetchJson<AdminUserRecord[]>("/api/admin/users", {
        headers: authHeaders,
      }),
  });

  const roleMutation = useMutation({
    mutationFn: async ({ user, role }: { user: AdminUserRecord; role: AdminUserRecord["role"]; }) =>
      fetchJson<AdminUserRecord>(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      toast({ title: "Role updated" });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to update role",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (user: AdminUserRecord) => {
      await fetch(apiUrl(`/api/admin/users/${user.id}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
    },
    onSuccess: () => {
      toast({ title: "User status updated" });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
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
        <h1 className="text-3xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">Manage console access and enforce least privilege.</p>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Admin accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading admin accounts…</p>}
          {isError && <p className="text-sm text-destructive">Unable to load admin accounts.</p>}
          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data ?? []).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => roleMutation.mutate({ user, role: value as AdminUserRecord["role"] })}
                          disabled={roleMutation.isPending}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "secondary" : "outline"}>{user.isActive ? "Active" : "Disabled"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(user.lastActiveAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => statusMutation.mutate(user)}
                          disabled={statusMutation.isPending}
                        >
                          {user.isActive ? "Disable" : "Enable"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        No users found.
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

export default Users;

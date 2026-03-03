import { useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Bell, Users, Building2, Send } from "lucide-react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Vendor = {
  id: number;
  name: string;
  location: string | null;
};

type Notification = {
  id: number;
  title: string;
  body: string | null;
  userId: number | null;
  vendorId: number | null;
  productId: number | null;
  isRead: boolean;
  createdAt: string;
  user?: User | null;
  vendor?: Vendor | null;
};

const Notifications = () => {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipientType, setRecipientType] = useState<string>("all_users");
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);

  // Fetch users
  const { data: users } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () =>
      fetchJson<User[]>("/api/admin/users", {
        headers: authHeaders,
      }),
    enabled: recipientType === "user",
  });

  // Fetch vendors
  const { data: vendors } = useQuery({
    queryKey: ["admin", "vendors"],
    queryFn: () =>
      fetchJson<Vendor[]>("/api/admin/vendors", {
        headers: authHeaders,
      }),
    enabled: recipientType === "vendor",
  });

  // Fetch recent notifications
  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () =>
      fetchJson<Notification[]>("/api/admin/notifications", {
        headers: authHeaders,
      }),
    refetchInterval: 30000,
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      body: string;
      recipientType: string;
      recipientIds?: number[];
    }) =>
      fetchJson("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(data),
      }),
    onSuccess: (data: any) => {
      toast({
        title: "Notification sent",
        description: `Successfully sent to ${data.count} recipient(s)`,
      });
      setTitle("");
      setBody("");
      setSelectedRecipients([]);
      refetchNotifications();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    const data: any = {
      title: title.trim(),
      body: body.trim(),
      recipientType,
    };

    if (
      (recipientType === "user" || recipientType === "vendor") &&
      selectedRecipients.length === 0
    ) {
      toast({
        title: "Error",
        description: "Please select at least one recipient",
        variant: "destructive",
      });
      return;
    }

    if (recipientType === "user" || recipientType === "vendor") {
      data.recipientIds = selectedRecipients;
    }

    sendNotificationMutation.mutate(data);
  };

  const recentNotifications = notifications?.slice(0, 20) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Send Notifications</h1>
        <Bell className="h-8 w-8 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Notification message (optional)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientType">Recipients</Label>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger id="recipientType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_users">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>All Users</span>
                  </div>
                </SelectItem>
                <SelectItem value="all_vendors">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>All Vendors</span>
                  </div>
                </SelectItem>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Specific Users</span>
                  </div>
                </SelectItem>
                <SelectItem value="vendor">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Specific Vendors</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipientType === "user" && (
            <div className="space-y-2">
              <Label>Select Users</Label>
              <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
                {users?.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-2 py-2"
                  >
                    <input
                      type="checkbox"
                      id={`user-${user.id}`}
                      checked={selectedRecipients.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecipients([...selectedRecipients, user.id]);
                        } else {
                          setSelectedRecipients(
                            selectedRecipients.filter((id) => id !== user.id)
                          );
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`user-${user.id}`}
                      className="text-sm flex-1 cursor-pointer"
                    >
                      {user.name} ({user.email})
                      <Badge variant="outline" className="ml-2">
                        {user.role}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recipientType === "vendor" && (
            <div className="space-y-2">
              <Label>Select Vendors</Label>
              <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
                {vendors?.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center space-x-2 py-2"
                  >
                    <input
                      type="checkbox"
                      id={`vendor-${vendor.id}`}
                      checked={selectedRecipients.includes(vendor.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecipients([
                            ...selectedRecipients,
                            vendor.id,
                          ]);
                        } else {
                          setSelectedRecipients(
                            selectedRecipients.filter((id) => id !== vendor.id)
                          );
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`vendor-${vendor.id}`}
                      className="text-sm flex-1 cursor-pointer"
                    >
                      {vendor.name} {vendor.location && `(${vendor.location})`}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={sendNotificationMutation.isPending}
            className="w-full"
          >
            <Send className="mr-2 h-4 w-4" />
            {sendNotificationMutation.isPending
              ? "Sending..."
              : "Send Notification"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No notifications sent yet
                  </TableCell>
                </TableRow>
              ) : (
                recentNotifications.map((notif) => (
                  <TableRow key={notif.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{notif.title}</div>
                        {notif.body && (
                          <div className="text-sm text-muted-foreground truncate max-w-md">
                            {notif.body}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {notif.userId && notif.user && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{notif.user.name}</span>
                        </div>
                      )}
                      {notif.vendorId && notif.vendor && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{notif.vendor.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={notif.isRead ? "secondary" : "default"}>
                        {notif.isRead ? "Read" : "Unread"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(notif.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;

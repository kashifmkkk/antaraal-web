import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { fetchJson } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";

type AdminSettings = {
  notificationEmail: string;
  rfqAutoAssign: boolean;
  dailyDigest: boolean;
  complianceNotes: string;
};

const Settings = () => {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const [formState, setFormState] = useState<AdminSettings | null>(null);

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () =>
      fetchJson<AdminSettings>("/api/admin/settings", {
        headers: authHeaders,
      }),
  });

  useEffect(() => {
    if (data) {
      setFormState(data);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (settings: AdminSettings) =>
      fetchJson<AdminSettings>("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      toast({ title: "Settings saved" });
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to save settings",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState) {
      return;
    }
    mutation.mutate(formState);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure operational preferences for the admin console.</p>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Notification & compliance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !formState ? (
            <p className="text-sm text-muted-foreground">Loading settings…</p>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="notificationEmail">Primary notification email</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  value={formState?.notificationEmail ?? ""}
                  onChange={(event) =>
                    setFormState((prev) =>
                      prev ? { ...prev, notificationEmail: event.target.value } : { notificationEmail: event.target.value, rfqAutoAssign: false, dailyDigest: false, complianceNotes: "" },
                    )
                  }
                  placeholder="ops@skyway.aero"
                  disabled={mutation.isPending}
                  required
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-primary/15 bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Auto-assign RFQs to preferred vendors</p>
                  <p className="text-xs text-muted-foreground">Send new RFQs directly to the preferred vendor pool.</p>
                </div>
                <Switch
                  checked={formState?.rfqAutoAssign ?? false}
                  onCheckedChange={(checked) =>
                    setFormState((prev) =>
                      prev ? { ...prev, rfqAutoAssign: checked } : { notificationEmail: "", rfqAutoAssign: checked, dailyDigest: false, complianceNotes: "" },
                    )
                  }
                  disabled={mutation.isPending}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-primary/15 bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Daily digest</p>
                  <p className="text-xs text-muted-foreground">Receive a morning summary of open RFQs and escalations.</p>
                </div>
                <Switch
                  checked={formState?.dailyDigest ?? false}
                  onCheckedChange={(checked) =>
                    setFormState((prev) =>
                      prev ? { ...prev, dailyDigest: checked } : { notificationEmail: "", rfqAutoAssign: false, dailyDigest: checked, complianceNotes: "" },
                    )
                  }
                  disabled={mutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complianceNotes">Compliance notes</Label>
                <Textarea
                  id="complianceNotes"
                  value={formState?.complianceNotes ?? ""}
                  onChange={(event) =>
                    setFormState((prev) =>
                      prev
                        ? { ...prev, complianceNotes: event.target.value }
                        : {
                            notificationEmail: "",
                            rfqAutoAssign: false,
                            dailyDigest: false,
                            complianceNotes: event.target.value,
                          },
                    )
                  }
                  placeholder="Document audit requirements, evidence submission instructions, etc."
                  rows={4}
                  disabled={mutation.isPending}
                />
              </div>
              <Button type="submit" disabled={mutation.isPending}>
                Save preferences
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

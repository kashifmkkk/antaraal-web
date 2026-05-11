import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PricingRangeItem = {
  id: number;
  label: string;
  min: string;
  max: string;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type PricingRangesResponse = {
  buyers: PricingRangeItem[];
  sellers: PricingRangeItem[];
};

type PricingRangeFormState = {
  role: "BUYER" | "VENDOR";
  label: string;
  min: string;
  max: string;
  description: string;
};

const AdminPricingRanges = () => {
  const qc = useQueryClient();
  const { data = { buyers: [], sellers: [] }, isLoading } = useQuery<PricingRangesResponse>({
    queryKey: ["pricing-ranges"],
    queryFn: () => fetchJson<PricingRangesResponse>("/api/pricing-ranges"),
  });
  const [form, setForm] = useState<PricingRangeFormState>({ role: "BUYER", label: "", min: "", max: "", description: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const currentItems = useMemo(() => [...data.buyers, ...data.sellers], [data]);

  const resetForm = () => {
    setForm({ role: "BUYER", label: "", min: "", max: "", description: "" });
    setEditingId(null);
  };

  const validateForm = () => {
    if (!form.label.trim()) return "Label is required.";
    if (!form.min.trim()) return "Minimum value is required.";
    if (!form.max.trim()) return "Maximum value is required.";
    return null;
  };

  const create = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    await fetchJson("/api/pricing-ranges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    resetForm();
    qc.invalidateQueries({ queryKey: ["pricing-ranges"] });
  };

  const update = async () => {
    if (editingId === null) return;

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    await fetchJson(`/api/pricing-ranges/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    resetForm();
    qc.invalidateQueries({ queryKey: ["pricing-ranges"] });
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this pricing range?")) return;
    await fetchJson(`/api/pricing-ranges/${id}`, { method: "DELETE" });
    if (editingId === id) {
      resetForm();
    }
    qc.invalidateQueries({ queryKey: ["pricing-ranges"] });
  };

  const beginEdit = (item: PricingRangeItem, role: "BUYER" | "VENDOR") => {
    setEditingId(item.id);
    setForm({
      role,
      label: item.label,
      min: item.min,
      max: item.max,
      description: item.description ?? "",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Pricing Ranges (Admin)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="pricing-range-role">Role</Label>
              <select
                id="pricing-range-role"
                title="Pricing range role"
                aria-label="Pricing range role"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background"
                value={form.role}
                onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as PricingRangeFormState["role"] }))}
              >
                <option value="BUYER">Buyer</option>
                <option value="VENDOR">Vendor</option>
              </select>
              <Label htmlFor="pricing-range-label">Label</Label>
              <Input id="pricing-range-label" value={form.label} onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))} />
              <Label htmlFor="pricing-range-min">Min</Label>
              <Input id="pricing-range-min" value={form.min} onChange={(e) => setForm((s) => ({ ...s, min: e.target.value }))} />
              <Label htmlFor="pricing-range-max">Max</Label>
              <Input id="pricing-range-max" value={form.max} onChange={(e) => setForm((s) => ({ ...s, max: e.target.value }))} />
              <Label htmlFor="pricing-range-description">Description</Label>
              <Input id="pricing-range-description" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
              <div className="mt-3">
                {editingId === null ? (
                  <Button onClick={create}>Create</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={update}>Update</Button>
                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Existing Ranges</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <div>Loading...</div> : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Buyers</h3>
                  {data.buyers.map((b) => (
                    <div key={b.id} className="flex items-center justify-between border rounded p-2">
                      <div>
                        <div className="font-medium">{b.label}</div>
                        <div className="text-sm text-muted-foreground">{b.min} — {b.max}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => beginEdit(b, "BUYER")}>Edit</Button>
                        <Button variant="destructive" onClick={() => remove(b.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold">Sellers</h3>
                  {data.sellers.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border rounded p-2">
                      <div>
                        <div className="font-medium">{s.label}</div>
                        <div className="text-sm text-muted-foreground">{s.min} — {s.max}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => beginEdit(s, "VENDOR")}>Edit</Button>
                        <Button variant="destructive" onClick={() => remove(s.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPricingRanges;

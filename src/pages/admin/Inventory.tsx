import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fetchJson, apiUrl } from "@/lib/api";
import { useNotifications } from "@/hooks/useNotifications";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const availabilityOptions = ["Available", "On Request", "Reserved"] as const;
const warrantyStatuses = ["Active", "Expiring", "Expired"] as const;

type InventoryItem = {
  id: string;
  productId: string;
  name: string;
  category: string;
  categoryId?: number | null;
  vendor: string;
  image?: string | null;
  photos?: string[];
  price?: string | null;
  availability: (typeof availabilityOptions)[number];
  warrantyStatus: (typeof warrantyStatuses)[number];
  createdAt: string;
  updatedAt: string;
};

type InventoryPayload = {
  productId: string;
  name: string;
  category: string;
  categoryId?: number | null;
  vendor: string;
  availability: (typeof availabilityOptions)[number];
  warrantyStatus: (typeof warrantyStatuses)[number];
  image?: string | null;
  photos?: string[];
  price?: string;
};

const Inventory = () => {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formState, setFormState] = useState<InventoryPayload>({
    productId: "",
    name: "",
    category: "",
    categoryId: null,
    vendor: "",
    availability: "On Request",
    warrantyStatus: "Active",
    photos: [],
    price: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "inventory"],
    queryFn: () =>
      fetchJson<InventoryItem[]>("/api/admin/inventory", {
        headers: authHeaders,
      }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const { data: categoriesList } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      fetchJson<{ id: number; name: string; slug: string }[]>("/api/categories"),
    staleTime: 1000 * 60 * 5,
  });

  useNotifications();

  // UI state: search / filters / pagination
  const [searchQ, setSearchQ] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [vendorFilter, setVendorFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormState({
      productId: "",
      name: "",
      category: "",
      categoryId: null,
      vendor: "",
      availability: "On Request",
      warrantyStatus: "Active",
    });
  };

  const resolveImageSrc = (url?: string | null) => {
    if (!url) return '/placeholder.svg';
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) return apiUrl(url);
    return apiUrl('/' + url);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormState({
      productId: "",
      name: "",
      category: "",
      categoryId: null,
      vendor: "",
      availability: "On Request",
      warrantyStatus: "Active",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormState({
      productId: item.productId,
      name: item.name,
      category: item.category,
      categoryId: item.categoryId ?? null,
      vendor: item.vendor,
      availability: item.availability,
      warrantyStatus: item.warrantyStatus,
      image: item.image ?? undefined,
      photos: (item as any).photos && (item as any).photos.length > 0 ? (item as any).photos : item.image ? [item.image] : [],
      price: (item as any).price ?? "",
    });
    setIsModalOpen(true);
  };

  const upsertMutation = useMutation({
    mutationFn: async (payload: InventoryPayload) => {
      // normalize photos -> send last non-empty photo as main `image`
      const body: any = { ...payload };
      if (payload.photos && payload.photos.length > 0) {
        const photos = (payload.photos as string[]).filter(Boolean);
        if (photos.length > 0) {
          body.image = photos[photos.length - 1];
        }
      }

      if (editingItem) {
        return fetchJson<InventoryItem>(`/api/admin/inventory/${editingItem.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(authHeaders ?? {}),
          },
          body: JSON.stringify(body),
        });
      }

      return fetchJson<InventoryItem>("/api/admin/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      toast({ title: "Inventory updated" });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      closeModal();
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to save product",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: InventoryItem) => {
      const response = await fetch(apiUrl(`/api/admin/inventory/${item.id}`), {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(error.error || 'Failed to delete product');
      }
    },
    onSuccess: () => {
      toast({ title: "Product removed" });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to delete",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ item, availability }: { item: InventoryItem; availability: InventoryItem["availability"]; }) =>
      fetchJson<InventoryItem>(`/api/admin/inventory/${item.id}/availability`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify({ availability }),
      }),
    onSuccess: () => {
      toast({ title: "Availability updated" });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Status update failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    upsertMutation.mutate(formState);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage aircraft spares and overhaul-ready units.</p>
        </div>
        <Button onClick={openCreateModal}>Add product</Button>
      </div>

      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Inventory records</CardTitle>
        </CardHeader>
        <CardContent>
              {isLoading && <p className="text-sm text-muted-foreground">Loading inventory…</p>}
          {isError && <p className="text-sm text-destructive">Unable to load inventory.</p>}
          {!isLoading && !isError && (
            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Search product name, id or vendor"
                    value={searchQ}
                    onChange={(e) => {
                      setSearchQ(e.target.value);
                      setPage(1);
                    }}
                  />
                  <Select value={availabilityFilter} onValueChange={(v) => { setAvailabilityFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {availabilityOptions.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Category" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} />
                  <Input placeholder="Vendor" value={vendorFilter} onChange={(e) => { setVendorFilter(e.target.value); setPage(1); }} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">Page size:</div>
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5,10,20,50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Warranty</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const list = data ?? [];
                    const filtered = list.filter((item) => {
                      const q = searchQ.trim().toLowerCase();
                      if (q) {
                        if (!(`${item.name} ${item.productId} ${item.vendor} ${item.category}`.toLowerCase().includes(q))) return false;
                      }
                      if (availabilityFilter && availabilityFilter !== "all" && item.availability !== availabilityFilter) return false;
                      if (categoryFilter && item.category.toLowerCase().indexOf(categoryFilter.toLowerCase()) === -1) return false;
                      if (vendorFilter && item.vendor.toLowerCase().indexOf(vendorFilter.toLowerCase()) === -1) return false;
                      return true;
                    });
                    const total = filtered.length;
                    const pages = Math.max(1, Math.ceil(total / pageSize));
                    const p = Math.min(page, pages);
                    const paginated = filtered.slice((p - 1) * pageSize, p * pageSize);
                    // ensure page corrected
                    if (p !== page) setPage(p);
                    return paginated.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{item.productId}</TableCell>
                        <TableCell>
                          {(() => {
                            const photos = (item.photos && item.photos.length > 0) ? item.photos : (item.image ? [item.image] : []);
                            if (photos.length === 0) return <div className="w-12 h-8 bg-muted rounded" />;
                            if (photos.length === 1) {
                              return (
                                <div className="w-12 h-8 overflow-hidden rounded">
                                  <img src={resolveImageSrc(photos[0])} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                              );
                            }
                            return (
                              <div className="flex gap-1">
                                {photos.slice(0, 3).map((photo, idx) => (
                                  <div key={idx} className="w-8 h-8 overflow-hidden rounded border">
                                    <img src={resolveImageSrc(photo)} alt={`${item.name}-${idx}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                                {photos.length > 3 && (
                                  <div className="w-8 h-8 flex items-center justify-center bg-muted rounded border text-xs">+{photos.length - 3}</div>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.vendor}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.availability}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.warrantyStatus === "Expired" ? "destructive" : item.warrantyStatus === "Expiring" ? "outline" : "secondary"}>
                            {item.warrantyStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>Edit</Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={statusMutation.isPending}
                            onClick={() => statusMutation.mutate({
                              item,
                              availability: item.availability === "Available" ? "On Request" : "Available",
                            })}
                          >
                            {item.availability === "Available" ? "Mark On Request" : "Mark Available"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(item)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                  {(data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                        No inventory records yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
              {/* pagination controls */}
              <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-muted-foreground">
                  Showing {(() => {
                    const list = data ?? [];
                    const filtered = list.filter((item) => {
                      const q = searchQ.trim().toLowerCase();
                      if (q && !(`${item.name} ${item.productId} ${item.vendor} ${item.category}`.toLowerCase().includes(q))) return false;
                      if (availabilityFilter && availabilityFilter !== "all" && item.availability !== availabilityFilter) return false;
                      if (categoryFilter && item.category.toLowerCase().indexOf(categoryFilter.toLowerCase()) === -1) return false;
                      if (vendorFilter && item.vendor.toLowerCase().indexOf(vendorFilter.toLowerCase()) === -1) return false;
                      return true;
                    });
                    return filtered.length;
                  })()} records
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                  <div className="px-3 py-1 border rounded text-sm">Page {page}</div>
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={(() => {
                    const list = data ?? [];
                    const filtered = list.filter((item) => {
                      const q = searchQ.trim().toLowerCase();
                      if (q && !(`${item.name} ${item.productId} ${item.vendor} ${item.category}`.toLowerCase().includes(q))) return false;
                      if (availabilityFilter && availabilityFilter !== "all" && item.availability !== availabilityFilter) return false;
                      if (categoryFilter && item.category.toLowerCase().indexOf(categoryFilter.toLowerCase()) === -1) return false;
                      if (vendorFilter && item.vendor.toLowerCase().indexOf(vendorFilter.toLowerCase()) === -1) return false;
                      return true;
                    });
                    return filtered.length <= page * pageSize;
                  })()}>Next</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(open) => (open ? setIsModalOpen(true) : closeModal())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Update product" : "Add product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="uploadPhotos">Upload photos</Label>
              <input
                id="uploadPhotos"
                title="Upload product photos"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
                disabled={upsertMutation.isPending}
              />
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  onClick={async () => {
                    if (!selectedFiles || selectedFiles.length === 0) return;
                    const files = Array.from(selectedFiles);
                    // Try presign flow first
                    try {
                      const meta = files.map((f) => ({ name: f.name, type: f.type, size: f.size }));
                      const pres = await fetch(apiUrl('/api/admin/uploads/presign'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(authHeaders ?? {}) },
                        body: JSON.stringify({ files: meta }),
                      });
                      if (pres.ok) {
                        const presData = await pres.json();
                        // expected shape: { uploads: [{ uploadUrl, url, method?, headers? }] }
                        if (presData && Array.isArray(presData.uploads)) {
                          const uploadedUrls: string[] = [];
                          for (let i = 0; i < presData.uploads.length; i++) {
                            const upload = presData.uploads[i];
                            const file = files[i];
                            if (!upload || !upload.uploadUrl) continue;
                            const method = upload.method ?? 'PUT';
                            const headers = upload.headers ?? { 'Content-Type': file.type };
                            await fetch(upload.uploadUrl, { method, body: file, headers });
                            // prefer returned public url, otherwise strip query string from uploadUrl
                            const publicUrl = upload.url ?? (upload.uploadUrl.split('?')[0]);
                            uploadedUrls.push(publicUrl);
                          }
                          setFormState((prev) => ({ ...prev, photos: [...(prev.photos ?? []), ...uploadedUrls] }));
                          setSelectedFiles(null);
                          return;
                        }
                      }
                    } catch (err) {
                      // fall through to legacy upload
                    }

                    // fallback to server-side POST upload
                    try {
                      const fd = new FormData();
                      files.forEach((f) => fd.append('files', f));
                      const res = await fetch(apiUrl('/api/admin/uploads'), {
                        method: 'POST',
                        body: fd,
                        headers: authHeaders ?? {},
                      });
                      const data = await res.json();
                      setFormState((prev) => ({ ...prev, photos: [...(prev.photos ?? []), ...(data.urls ?? [])] }));
                      setSelectedFiles(null);
                    } catch (err) {
                      toast({ title: 'Upload failed', description: String(err), variant: 'destructive' });
                    }
                  }}
                >
                  Upload Files
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="productId">Product ID</Label>
              <Input
                id="productId"
                value={formState.productId}
                onChange={(event) => setFormState((prev) => ({ ...prev, productId: event.target.value }))}
                required
                disabled={upsertMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                required
                disabled={upsertMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>Photos</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Paste image URL and click Add"
                  value={formState.photos?.[formState.photos.length - 1] ?? ""}
                  onChange={(e) => {
                    const copy = formState.photos ? [...formState.photos] : [];
                    copy[copy.length - 1] = e.target.value;
                    setFormState((prev) => ({ ...prev, photos: copy }));
                  }}
                  disabled={upsertMutation.isPending}
                />
                <Button
                  type="button"
                  onClick={() => {
                    const copy = formState.photos ? [...formState.photos.filter(Boolean)] : [];
                    const last = (copy[copy.length - 1] || "").trim();
                    if (last.length === 0) {
                      // if last is empty, don't add duplicate
                      return setFormState((prev) => ({ ...prev, photos: copy }));
                    }
                    copy.push("");
                    setFormState((prev) => ({ ...prev, photos: copy }));
                  }}
                >
                  Add Photo
                </Button>
              </div>
              <div className="mt-2 overflow-x-auto py-2">
                <div className="flex gap-2">
                  {(formState.photos ?? []).filter(Boolean).map((url, idx) => (
                    <div key={idx} className="relative w-28 h-20 flex-shrink-0">
                      <img src={resolveImageSrc(url)} alt={`photo-${idx}`} className="w-full h-full object-cover rounded" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-sm"
                        onClick={() => {
                          const copy = [...(formState.photos ?? [])];
                          copy.splice(idx, 1);
                          setFormState((prev) => ({ ...prev, photos: copy }));
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {(formState.photos ?? []).filter(Boolean).length === 0 && (
                    <div className="text-sm text-muted-foreground">No photos yet. Add image URLs above.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formState.categoryId ? String(formState.categoryId) : "custom"}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setFormState((prev) => ({ ...prev, categoryId: null }));
                  } else {
                    const catId = Number(value);
                    const cat = (categoriesList ?? []).find((c) => c.id === catId);
                    setFormState((prev) => ({
                      ...prev,
                      categoryId: catId,
                      category: cat?.name ?? prev.category,
                    }));
                  }
                }}
                disabled={upsertMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom / Manual</SelectItem>
                  {(categoriesList ?? []).map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!formState.categoryId) && (
                <Input
                  id="category"
                  value={formState.category}
                  onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
                  required
                  disabled={upsertMutation.isPending}
                  placeholder="Enter category name manually"
                  className="mt-1"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                value={formState.vendor}
                onChange={(event) => setFormState((prev) => ({ ...prev, vendor: event.target.value }))}
                required
                disabled={upsertMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (INR)</Label>
              <Input
                id="price"
                value={formState.price ?? ""}
                onChange={(event) => setFormState((prev) => ({ ...prev, price: event.target.value }))}
                placeholder="e.g. 450000"
                disabled={upsertMutation.isPending}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Availability</Label>
                <Select
                  value={formState.availability}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, availability: value as InventoryPayload["availability"] }))
                  }
                  disabled={upsertMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {availabilityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Warranty status</Label>
                <Select
                  value={formState.warrantyStatus}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, warrantyStatus: value as InventoryPayload["warrantyStatus"] }))
                  }
                  disabled={upsertMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warranty" />
                  </SelectTrigger>
                  <SelectContent>
                    {warrantyStatuses.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeModal} disabled={upsertMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {editingItem ? "Save changes" : "Create product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;

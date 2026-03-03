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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchJson, apiUrl } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Tag, FolderOpen, Package } from "lucide-react";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
};

type ProductItem = {
  id: number;
  name: string;
  category: string | null;
  categoryId: number | null;
  referenceCode: string | null;
};

type CategoryPayload = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
};

const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

const Categories = () => {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [assignCategory, setAssignCategory] = useState<Category | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [searchQ, setSearchQ] = useState("");

  const [formState, setFormState] = useState<CategoryPayload>({
    name: "",
    slug: "",
    description: "",
    isActive: true,
  });

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () =>
      fetchJson<Category[]>("/api/admin/categories", {
        headers: authHeaders,
      }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchJson<ProductItem[]>("/api/products"),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormState({ name: "", slug: "", description: "", isActive: true });
  };

  const closeAssignModal = () => {
    setIsAssignOpen(false);
    setAssignCategory(null);
    setSelectedProductId("");
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormState({ name: "", slug: "", description: "", isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormState({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      isActive: cat.isActive,
    });
    setIsModalOpen(true);
  };

  const openAssignModal = (cat: Category) => {
    setAssignCategory(cat);
    setSelectedProductId("");
    setIsAssignOpen(true);
  };

  // Auto-generate slug from name (only when creating)
  useEffect(() => {
    if (!editingCategory && formState.name) {
      setFormState((prev) => ({ ...prev, slug: generateSlug(prev.name) }));
    }
  }, [formState.name, editingCategory]);

  const upsertMutation = useMutation({
    mutationFn: async (payload: CategoryPayload) => {
      if (editingCategory) {
        return fetchJson<Category>(`/api/admin/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(authHeaders ?? {}),
          },
          body: JSON.stringify(payload),
        });
      }
      return fetchJson<Category>("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast({ title: editingCategory ? "Category updated" : "Category created" });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeModal();
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to save category",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (cat: Category) => {
      const response = await fetch(apiUrl(`/api/admin/categories/${cat.id}`), {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Delete failed" }));
        throw new Error(error.error || "Failed to delete category");
      }
    },
    onSuccess: () => {
      toast({ title: "Category deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to delete",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({
      categoryId,
      productId,
    }: {
      categoryId: number;
      productId: number;
    }) => {
      return fetchJson(`/api/admin/categories/${categoryId}/assign-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders ?? {}),
        },
        body: JSON.stringify({ productId }),
      });
    },
    onSuccess: () => {
      toast({ title: "Product assigned to category" });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeAssignModal();
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to assign product",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    upsertMutation.mutate(formState);
  };

  const handleAssignSubmit = () => {
    if (!assignCategory || !selectedProductId) return;
    assignMutation.mutate({
      categoryId: assignCategory.id,
      productId: Number(selectedProductId),
    });
  };

  const filtered = useMemo(() => {
    if (!categories) return [];
    const q = searchQ.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q))
    );
  }, [categories, searchQ]);

  const totalProducts = useMemo(() => {
    return (categories ?? []).reduce(
      (sum, cat) => sum + (cat._count?.products ?? cat.productCount ?? 0),
      0
    );
  }, [categories]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage product categories and assign products to them.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-primary/10 bg-card/80">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categories?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Total Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/10 bg-card/80">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-green-500/10 p-3">
              <Tag className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {categories?.filter((c) => c.isActive).length ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Active Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/10 bg-card/80">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <Package className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalProducts}</p>
              <p className="text-sm text-muted-foreground">Tagged Products</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border-primary/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Category Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading categories…</p>
          )}
          {isError && (
            <p className="text-sm text-destructive">Unable to load categories.</p>
          )}
          {!isLoading && !isError && (
            <div>
              <div className="mb-3">
                <Input
                  placeholder="Search categories…"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Products</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No categories found
                        </TableCell>
                      </TableRow>
                    )}
                    {filtered.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">
                          {cat.slug}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {cat.description ?? "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {cat._count?.products ?? cat.productCount ?? 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={cat.isActive ? "default" : "outline"}
                            className={
                              cat.isActive
                                ? "bg-green-500/10 text-green-600 border-green-500/30"
                                : "bg-red-500/10 text-red-600 border-red-500/30"
                            }
                          >
                            {cat.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Assign products"
                              onClick={() => openAssignModal(cat)}
                            >
                              <Tag className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Edit"
                              onClick={() => openEditModal(cat)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Delete"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete category "${cat.name}"? This cannot be undone.`
                                  )
                                ) {
                                  deleteMutation.mutate(cat);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Category Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={formState.name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Aerospace Machining"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug *</Label>
              <Input
                id="cat-slug"
                value={formState.slug}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="e.g. aerospace-machining"
                required
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier. Auto-generated from name.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Input
                id="cat-desc"
                value={formState.description}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief description of this category"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cat-active"
                title="Category active status"
                checked={formState.isActive}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, isActive: e.target.checked }))
                }
                className="rounded"
              />
              <Label htmlFor="cat-active">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending
                  ? "Saving…"
                  : editingCategory
                  ? "Update"
                  : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Product to Category Modal */}
      <Dialog open={isAssignOpen} onOpenChange={(open) => !open && closeAssignModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Assign Product to "{assignCategory?.name}"
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Product</Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product…" />
                </SelectTrigger>
                <SelectContent>
                  {(products ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.referenceCode ? `${p.referenceCode} — ` : ""}
                      {p.name}
                      {p.categoryId ? ` (in category ${p.categoryId})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeAssignModal}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignSubmit}
                disabled={!selectedProductId || assignMutation.isPending}
              >
                {assignMutation.isPending ? "Assigning…" : "Assign"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;

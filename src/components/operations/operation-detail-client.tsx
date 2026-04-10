"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronRight,
  MoreHorizontal,
  Copy,
  Trash2,
  Check,
  Loader2,
  Plus,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────

interface MilestoneLevel {
  id: string;
  memberCount: number;
  label: string;
}

interface OpexItemData {
  id: string;
  name: string;
  description: string | null;
  vendor: string | null;
  milestones: { memberCount: number; monthlyCost: number; notes: string | null }[];
}

interface CategoryFormState {
  name: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: string;
}

interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  items: OpexItemData[];
}

// ─── Props ──────────────────────────────────────────────────────────

interface OperationDetailClientProps {
  categoryId?: string;
  initialCategory?: CategoryData;
  milestoneLevels: MilestoneLevel[];
}

// ─── Helpers ────────────────────────────────────────────────────────

function categoryToForm(cat: CategoryData): CategoryFormState {
  return {
    name: cat.name,
    description: cat.description || "",
    icon: cat.icon || "",
    color: cat.color || "#6B7280",
    sortOrder: String(cat.sortOrder),
  };
}

function formToPayload(form: CategoryFormState) {
  return {
    name: form.name,
    description: form.description || undefined,
    icon: form.icon || undefined,
    color: form.color || "#6B7280",
    sortOrder: parseInt(form.sortOrder) || 0,
  };
}

const DEFAULT_FORM: CategoryFormState = {
  name: "",
  description: "",
  icon: "folder",
  color: "#6B7280",
  sortOrder: "0",
};

// ─── Component ──────────────────────────────────────────────────────

export function OperationDetailClient({
  categoryId,
  initialCategory,
  milestoneLevels,
}: OperationDetailClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<CategoryFormState>(
    initialCategory ? categoryToForm(initialCategory) : DEFAULT_FORM
  );
  const [items, setItems] = useState<OpexItemData[]>(
    initialCategory?.items || []
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Expanded items tracking
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Duplicate modal
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add item state
  const [addingItem, setAddingItem] = useState(false);

  function updateForm(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleExpanded(itemId: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  // ─── Save / Create category ─────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return;

    // Create mode
    if (!categoryId) {
      setSaving(true);
      try {
        const res = await fetch("/api/operation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formToPayload(form)),
        });
        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error || "Failed to create category");
          return;
        }
        const json = await res.json();
        toast.success("Category created");
        router.push(`/admin/operation/finances/expenses/${json.data.id}`);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Edit mode
    setSaving(true);
    try {
      const payload = formToPayload(form);
      const res = await fetch(`/api/operations/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateCategory",
          name: payload.name,
          description: payload.description,
          icon: payload.icon,
          sortOrder: payload.sortOrder,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to save");
        return;
      }
      setSaved(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [form, categoryId, router]);

  // ─── Add item ───────────────────────────────────────────────────

  const handleAddItem = useCallback(async () => {
    if (!categoryId) return;
    setAddingItem(true);
    try {
      const defaultMilestones = milestoneLevels.map((ml) => ({
        memberCount: ml.memberCount,
        monthlyCost: 0,
        notes: null as string | null,
      }));
      const res = await fetch(`/api/operations/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addItem",
          name: "New Item",
          description: "",
          vendor: "",
          milestones: defaultMilestones,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to add item");
        return;
      }
      const json = await res.json();
      const newItem: OpexItemData = {
        id: json.data.id,
        name: json.data.name,
        description: json.data.description,
        vendor: json.data.vendor,
        milestones: json.data.milestones.map(
          (m: { memberCount: number; monthlyCost: number; notes: string | null }) => ({
            memberCount: m.memberCount,
            monthlyCost: Number(m.monthlyCost),
            notes: m.notes,
          })
        ),
      };
      setItems((prev) => [...prev, newItem]);
      setExpandedItems((prev) => new Set(prev).add(newItem.id));
      toast.success("Item added");
    } finally {
      setAddingItem(false);
    }
  }, [categoryId, milestoneLevels]);

  // ─── Update item ────────────────────────────────────────────────

  const handleUpdateItem = useCallback(
    async (item: OpexItemData) => {
      if (!categoryId) return;
      try {
        const res = await fetch(`/api/operations/${categoryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updateItem",
            itemId: item.id,
            name: item.name,
            description: item.description || undefined,
            vendor: item.vendor || undefined,
            milestones: item.milestones.map((m) => ({
              memberCount: m.memberCount,
              monthlyCost: m.monthlyCost,
              notes: m.notes,
            })),
          }),
        });
        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error || "Failed to update item");
        }
      } catch {
        toast.error("Failed to update item");
      }
    },
    [categoryId]
  );

  // ─── Delete item ────────────────────────────────────────────────

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (!categoryId) return;
      try {
        const res = await fetch(`/api/operations/${categoryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "deleteItem", itemId }),
        });
        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error || "Failed to delete item");
          return;
        }
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        toast.success("Item deleted");
      } catch {
        toast.error("Failed to delete item");
      }
    },
    [categoryId]
  );

  // ─── Duplicate ──────────────────────────────────────────────────

  const handleDuplicate = useCallback(async () => {
    if (!duplicateName.trim()) {
      toast.error("Enter a name for the duplicate");
      return;
    }
    setDuplicating(true);
    try {
      const payload = formToPayload(form);
      const res = await fetch("/api/operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          name: duplicateName.trim(),
          items: items.map((item) => ({
            name: item.name,
            description: item.description || undefined,
            vendor: item.vendor || undefined,
            milestones: item.milestones.map((m) => ({
              memberCount: m.memberCount,
              monthlyCost: m.monthlyCost,
              notes: m.notes,
            })),
          })),
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to duplicate");
        return;
      }
      const json = await res.json();
      toast.success("Category duplicated");
      setDuplicateOpen(false);
      setDuplicateName("");
      router.push(`/admin/operation/finances/expenses/${json.data.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDuplicating(false);
    }
  }, [duplicateName, form, items, router]);

  // ─── Delete category ────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    if (!categoryId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/operations/${categoryId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to delete");
        return;
      }
      toast.success("Category deleted");
      setDeleteOpen(false);
      router.push("/admin/operation/finances/expenses");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }, [categoryId, router]);

  // ─── Local item field update ────────────────────────────────────

  function updateItemField(
    itemId: string,
    field: keyof OpexItemData,
    value: string
  ) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  }

  function updateItemMilestone(
    itemId: string,
    memberCount: number,
    monthlyCost: number
  ) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const milestones = item.milestones.map((m) =>
          m.memberCount === memberCount ? { ...m, monthlyCost } : m
        );
        // If milestone doesn't exist for this level, add it
        if (!milestones.find((m) => m.memberCount === memberCount)) {
          milestones.push({ memberCount, monthlyCost, notes: null });
        }
        return { ...item, milestones };
      })
    );
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col -m-6 min-h-[100vh]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b py-3 px-4">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/operation/finances/expenses"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Expenses
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium">
            {form.name || "New Category"}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          {/* Save button */}
          <Button
            size="sm"
            className="bg-[#C5F135] text-black hover:bg-[#C5F135]/90"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving
              </>
            ) : saved ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Saved
              </>
            ) : categoryId ? (
              "Save"
            ) : (
              "Create"
            )}
          </Button>

          {/* Actions menu */}
          {categoryId && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md border border-input bg-background h-8 w-8 text-sm shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => {
                    setDuplicateName(`${form.name} (Copy)`);
                    setDuplicateOpen(true);
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-8">
          {/* Overview Section */}
          <section className="space-y-5">
            <h2 className="text-sm font-semibold">Overview</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  onBlur={categoryId ? handleSave : undefined}
                  placeholder="Software & Tools"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-sort">Sort Order</Label>
                <Input
                  id="cat-sort"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => updateForm("sortOrder", e.target.value)}
                  onBlur={categoryId ? handleSave : undefined}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-description">Description</Label>
              <Textarea
                id="cat-description"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                onBlur={categoryId ? handleSave : undefined}
                placeholder="Category description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-icon">Icon (Lucide name)</Label>
                <Input
                  id="cat-icon"
                  value={form.icon}
                  onChange={(e) => updateForm("icon", e.target.value)}
                  onBlur={categoryId ? handleSave : undefined}
                  placeholder="folder"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-color">Color</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-md border shrink-0"
                    style={{ backgroundColor: form.color || "#6B7280" }}
                  />
                  <Input
                    id="cat-color"
                    value={form.color}
                    onChange={(e) => updateForm("color", e.target.value)}
                    onBlur={categoryId ? handleSave : undefined}
                    placeholder="#6B7280"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Expense Items Section */}
          {categoryId && (
            <section className="space-y-5 border-t pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Expense Items</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddItem}
                  disabled={addingItem}
                >
                  {addingItem ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Add Item
                </Button>
              </div>

              {/* Milestone levels header */}
              {items.length > 0 && milestoneLevels.length > 0 && (
                <div className="space-y-3">
                  {items.map((item) => {
                    const isExpanded = expandedItems.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className="rounded-lg border bg-card overflow-hidden"
                      >
                        {/* Collapsed header */}
                        <button
                          type="button"
                          className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                          onClick={() => toggleExpanded(item.id)}
                        >
                          <div className="flex items-center gap-3">
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                isExpanded ? "" : "-rotate-90"
                              }`}
                            />
                            <div>
                              <span className="text-sm font-medium">
                                {item.name}
                              </span>
                              {item.vendor && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  {item.vendor}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {item.milestones.length > 0 && (
                              <span>
                                {item.milestones.length} milestone
                                {item.milestones.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="border-t px-4 py-4 space-y-4">
                            {/* Item fields */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs">Name</Label>
                                <Input
                                  value={item.name}
                                  onChange={(e) =>
                                    updateItemField(
                                      item.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  onBlur={() => handleUpdateItem(item)}
                                  className="text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Vendor</Label>
                                <Input
                                  value={item.vendor || ""}
                                  onChange={(e) =>
                                    updateItemField(
                                      item.id,
                                      "vendor",
                                      e.target.value
                                    )
                                  }
                                  onBlur={() => handleUpdateItem(item)}
                                  placeholder="Vendor name"
                                  className="text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Description</Label>
                                <Input
                                  value={item.description || ""}
                                  onChange={(e) =>
                                    updateItemField(
                                      item.id,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  onBlur={() => handleUpdateItem(item)}
                                  placeholder="Brief description"
                                  className="text-sm"
                                />
                              </div>
                            </div>

                            {/* Milestone costs grid */}
                            <div className="space-y-2">
                              <Label className="text-xs">
                                Monthly Cost by Milestone
                              </Label>
                              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(milestoneLevels.length, 6)}, 1fr)` }}>
                                {milestoneLevels.map((ml) => {
                                  const milestone = item.milestones.find(
                                    (m) => m.memberCount === ml.memberCount
                                  );
                                  const cost = milestone?.monthlyCost ?? 0;
                                  return (
                                    <div key={ml.id} className="space-y-1">
                                      <span className="text-[10px] text-muted-foreground block truncate">
                                        {ml.label}
                                      </span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={cost || ""}
                                        onChange={(e) =>
                                          updateItemMilestone(
                                            item.id,
                                            ml.memberCount,
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        onBlur={() => handleUpdateItem(item)}
                                        placeholder="0.00"
                                        className="text-xs h-8 font-mono"
                                      />
                                      {cost > 0 && (
                                        <span className="text-[10px] text-muted-foreground block">
                                          {formatCurrency(cost)}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Delete item button */}
                            <div className="flex justify-end pt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-500 hover:bg-red-500/10 text-xs"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1.5" />
                                Delete Item
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {items.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No expense items yet. Click &quot;Add Item&quot; to get
                  started.
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Duplicate Category
            </DialogTitle>
            <DialogDescription>
              Create a copy of this category with all its items and milestones.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category Name</label>
            <Input
              placeholder="Category name..."
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              className="text-sm"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDuplicateOpen(false)}
              disabled={duplicating}
            >
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={duplicating}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              {duplicating ? "Duplicating..." : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-4 w-4" />
              Delete Category
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{form.name}</strong>? This
              will also remove all expense items. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

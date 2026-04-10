"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Plus,
  Boxes,
  ArrowRight,
  LayoutGrid,
  List,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  X,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────

interface PackageVariant {
  id: string;
  subscriptionTierId: string;
  isComplete: boolean;
  totalCreditsUsed: number;
  subscriptionTier: {
    id: string;
    name: string;
    monthlyCredits: number;
  };
  _count: { products: number };
}

interface PackageItem {
  id: string;
  name: string;
  slug: string;
  fitnessGoal: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  sortOrder: number;
  variants: PackageVariant[];
}

interface PackagesClientProps {
  initialPackages: PackageItem[];
}

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: "Weight Loss",
  MUSCLE_GAIN: "Muscle Gain",
  PERFORMANCE: "Performance",
  ENDURANCE: "Endurance",
  GENERAL_WELLNESS: "General Wellness",
  RECOVERY: "Recovery",
  STRENGTH: "Strength",
  BODY_RECOMP: "Body Recomp",
  CUSTOM: "Custom",
};

const GOAL_COLORS: Record<string, string> = {
  WEIGHT_LOSS: "bg-red-100 text-red-800",
  MUSCLE_GAIN: "bg-blue-100 text-blue-800",
  PERFORMANCE: "bg-purple-100 text-purple-800",
  ENDURANCE: "bg-green-100 text-green-800",
  GENERAL_WELLNESS: "bg-amber-100 text-amber-800",
  RECOVERY: "bg-teal-100 text-teal-800",
  STRENGTH: "bg-orange-100 text-orange-800",
  BODY_RECOMP: "bg-cyan-100 text-cyan-800",
  CUSTOM: "bg-zinc-100 text-zinc-800",
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-zinc-800/60 text-zinc-200",
  ACTIVE: "bg-emerald-600/80 text-white",
  ARCHIVED: "bg-gray-600/60 text-gray-200",
};

const STATUS_DOT: Record<string, string> = {
  DRAFT: "bg-zinc-400",
  ACTIVE: "bg-emerald-500",
  ARCHIVED: "bg-gray-400",
};

const DEFAULT_IMAGES: Record<string, string> = {
  WEIGHT_LOSS: "/images/packages/weight-loss.svg",
  MUSCLE_GAIN: "/images/packages/muscle-gain.svg",
  PERFORMANCE: "/images/packages/performance.svg",
  ENDURANCE: "/images/packages/endurance.svg",
  GENERAL_WELLNESS: "/images/packages/general-wellness.svg",
  RECOVERY: "/images/packages/recovery.svg",
};

// ─── Component ────────────────────────────────────────────────

export function PackagesClient({ initialPackages }: PackagesClientProps) {
  const [packages, setPackages] = useState<PackageItem[]>(initialPackages);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [deleteTarget, setDeleteTarget] = useState<PackageItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/packages");
      if (!res.ok) return;
      const json = await res.json();
      setPackages(json.data);
    } catch {
      // silent
    }
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/packages/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      await refresh();
    } catch {
      toast.error("Failed to delete package");
    } finally {
      setDeleting(false);
    }
  }

  async function handleBulkDelete() {
    setDeleting(true);
    const ids = [...selected];
    let deleted = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/packages/${id}`, { method: "DELETE" });
        if (res.ok) deleted++;
      } catch {
        // continue
      }
    }
    toast.success(`Deleted ${deleted} package${deleted !== 1 ? "s" : ""}`);
    setSelected(new Set());
    setBulkDeleteOpen(false);
    setDeleting(false);
    await refresh();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(goalPackages: PackageItem[]) {
    const allSelected = goalPackages.every((p) => selected.has(p.id));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of goalPackages) {
        if (allSelected) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  }

  // Group by fitness goal
  const grouped = packages.reduce<Record<string, PackageItem[]>>((acc, pkg) => {
    if (!acc[pkg.fitnessGoal]) acc[pkg.fitnessGoal] = [];
    acc[pkg.fitnessGoal].push(pkg);
    return acc;
  }, {});

  const totalPackages = packages.length;
  const isListView = viewMode === "list";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Packages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pre-built product bundles for each fitness goal and plan tier.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              className={`p-2 transition-colors ${viewMode === "card" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => { setViewMode("card"); setSelected(new Set()); }}
              title="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => router.push("/admin/program/packages/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Package
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(new Set())}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">
              {selected.size} package{selected.size !== 1 ? "s" : ""} selected
            </span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Packages grouped by goal */}
      {Object.keys(GOAL_LABELS).map((goal) => {
        const goalPackages = grouped[goal];
        if (!goalPackages || goalPackages.length === 0) return null;

        const allGoalSelected = goalPackages.every((p) => selected.has(p.id));
        const someGoalSelected = goalPackages.some((p) => selected.has(p.id));

        return (
          <div key={goal} className="space-y-3">
            <div className="flex items-center gap-2">
              {isListView && (
                <input
                  type="checkbox"
                  checked={allGoalSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someGoalSelected && !allGoalSelected;
                  }}
                  onChange={() => toggleSelectAll(goalPackages)}
                  className="h-4 w-4 rounded border-border accent-foreground cursor-pointer"
                />
              )}
              <Badge className={GOAL_COLORS[goal]}>{GOAL_LABELS[goal]}</Badge>
              <span className="text-sm text-muted-foreground">
                {goalPackages.length} package{goalPackages.length !== 1 ? "s" : ""}
              </span>
            </div>

            {viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {goalPackages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    onView={() => router.push(`/admin/program/packages/${pkg.id}`)}
                    onEdit={() => router.push(`/admin/program/packages/${pkg.id}/edit`)}
                    onDelete={() => setDeleteTarget(pkg)}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                {goalPackages.map((pkg) => (
                  <PackageRow
                    key={pkg.id}
                    pkg={pkg}
                    selected={selected.has(pkg.id)}
                    onToggleSelect={() => toggleSelect(pkg.id)}
                    onView={() => router.push(`/admin/program/packages/${pkg.id}`)}
                    onEdit={() => router.push(`/admin/program/packages/${pkg.id}/edit`)}
                    onDelete={() => setDeleteTarget(pkg)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {totalPackages === 0 && (
        <div className="text-center py-20">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Boxes className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No packages yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">
            Create your first package to bundle products for a fitness goal
            across your subscription tiers.
          </p>
          <Button onClick={() => router.push("/admin/program/packages/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Package
          </Button>
        </div>
      )}

      {/* Single delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Package</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? This will remove
              all tier configurations and product assignments. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose
              render={<Button variant="outline" disabled={deleting} />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirmation dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {selected.size} Package{selected.size !== 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selected.size} package{selected.size !== 1 ? "s" : ""}?
              This will remove all tier configurations and product assignments for each. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose
              render={<Button variant="outline" disabled={deleting} />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : `Delete ${selected.size} Package${selected.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Card View ───────────────────────────────────────────────

function PackageCard({
  pkg,
  onView,
  onEdit,
  onDelete,
}: {
  pkg: PackageItem;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const configuredCount = pkg.variants.filter((v) => v._count.products > 0).length;
  const totalVariants = pkg.variants.length;
  const totalProducts = pkg.variants.reduce((sum, v) => sum + v._count.products, 0);
  const imageUrl = pkg.imageUrl || DEFAULT_IMAGES[pkg.fitnessGoal] || DEFAULT_IMAGES.GENERAL_WELLNESS;

  return (
    <div className="group relative rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-border/80">
      {/* Clickable area */}
      <div className="cursor-pointer" onClick={onView}>
        {/* Image */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={imageUrl}
            alt={pkg.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge className={STATUS_STYLES[pkg.status] || STATUS_STYLES.DRAFT}>
              {pkg.status}
            </Badge>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 right-3">
            <span className="text-xs text-white/90 font-medium">
              {totalProducts} product{totalProducts !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-1">
              {pkg.name}
            </h3>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {pkg.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {pkg.description}
            </p>
          )}

          {/* Tier progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {configuredCount}/{totalVariants} tiers configured
              </span>
            </div>
            <div className="flex gap-1">
              {pkg.variants.map((v) => (
                <div
                  key={v.id}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    v._count.products > 0 ? "bg-emerald-500" : "bg-zinc-200"
                  }`}
                  title={`${v.subscriptionTier.name}: ${v._count.products} products`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Options menu — positioned top-right over the image */}
      <div className="absolute top-3 right-3 z-10">
        <OptionsMenu onView={onView} onEdit={onEdit} onDelete={onDelete} dark />
      </div>
    </div>
  );
}

// ─── List View ───────────────────────────────────────────────

function PackageRow({
  pkg,
  selected,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
}: {
  pkg: PackageItem;
  selected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const configuredCount = pkg.variants.filter((v) => v._count.products > 0).length;
  const totalVariants = pkg.variants.length;
  const totalProducts = pkg.variants.reduce((sum, v) => sum + v._count.products, 0);
  const imageUrl = pkg.imageUrl || DEFAULT_IMAGES[pkg.fitnessGoal] || DEFAULT_IMAGES.GENERAL_WELLNESS;

  return (
    <div
      className={`flex items-center gap-4 p-4 transition-colors cursor-pointer ${
        selected ? "bg-muted/50" : "bg-card hover:bg-muted/30"
      }`}
      onClick={onView}
    >
      {/* Checkbox */}
      <div onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-border accent-foreground cursor-pointer"
        />
      </div>

      {/* Thumbnail */}
      <img
        src={imageUrl}
        alt={pkg.name}
        className="h-12 w-12 rounded-lg object-cover shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate">{pkg.name}</h3>
          <div className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[pkg.status] || STATUS_DOT.DRAFT}`} />
          <span className="text-xs text-muted-foreground shrink-0">
            {pkg.status.charAt(0) + pkg.status.slice(1).toLowerCase()}
          </span>
        </div>
        {pkg.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {pkg.description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-6 shrink-0">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Products</p>
          <p className="text-sm font-medium">{totalProducts}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Tiers</p>
          <p className="text-sm font-medium">
            {configuredCount}/{totalVariants}
          </p>
        </div>
        {/* Tier progress mini */}
        <div className="flex gap-0.5 w-20">
          {pkg.variants.map((v) => (
            <div
              key={v.id}
              className={`h-1.5 flex-1 rounded-full ${
                v._count.products > 0 ? "bg-emerald-500" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Options */}
      <div onClick={(e) => e.stopPropagation()}>
        <OptionsMenu onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}

// ─── Options Menu ────────────────────────────────────────────

function OptionsMenu({
  onView,
  onEdit,
  onDelete,
  dark,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  dark?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`p-1.5 rounded-lg transition-colors ${
          dark
            ? "bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onView}>
          <Eye className="h-4 w-4 mr-2" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

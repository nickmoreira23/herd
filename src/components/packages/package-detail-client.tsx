"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TierVariantBuilder } from "./tier-variant-builder";
import type { RedemptionRule } from "@/lib/credit-cost";

// ─── Types ────────────────────────────────────────────────────

interface ProductInVariant {
  id: string;
  productId: string;
  quantity: number;
  creditCost: number;
  sortOrder: number;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    subCategory: string | null;
    retailPrice: number;
    memberPrice: number;
    imageUrl: string | null;
  };
}

interface Variant {
  id: string;
  packageId: string;
  subscriptionTierId: string;
  isComplete: boolean;
  totalCreditsUsed: number;
  notes: string | null;
  subscriptionTier: {
    id: string;
    name: string;
    slug: string;
    monthlyCredits: number;
    monthlyPrice: number;
    colorAccent: string;
    sortOrder: number;
    iconUrl: string | null;
  };
  products: ProductInVariant[];
}

interface PackageData {
  id: string;
  name: string;
  slug: string;
  fitnessGoal: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  sortOrder: number;
  variants: Variant[];
}

interface PackageDetailClientProps {
  initialPackage: PackageData;
  redemptionRulesByTier: Record<string, RedemptionRule[]>;
  totalActiveTiers: number;
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

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
];

// ─── Component ────────────────────────────────────────────────

export function PackageDetailClient({
  initialPackage,
  redemptionRulesByTier,
  totalActiveTiers,
}: PackageDetailClientProps) {
  const router = useRouter();
  const [pkg, setPkg] = useState(initialPackage);
  const [name, setName] = useState(pkg.name);
  const [description, setDescription] = useState(pkg.description || "");
  const [status, setStatus] = useState(pkg.status);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveField = useCallback(
    async (field: string, value: unknown) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/packages/${pkg.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          toast.error(json?.error || "Failed to save");
        }
      } catch {
        toast.error("Failed to save");
      } finally {
        setSaving(false);
      }
    },
    [pkg.id]
  );

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/packages/${pkg.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete package");
        return;
      }
      toast.success("Package deleted");
      router.push("/admin/program/packages");
    } catch {
      toast.error("Failed to delete package");
    } finally {
      setDeleting(false);
    }
  }

  const configuredCount = pkg.variants.filter(
    (v) => v.products.length > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/program/packages/${pkg.id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Package
        </Button>

        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Header section */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                className="text-xl font-bold border-none px-0 h-auto focus-visible:ring-0 shadow-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => {
                  if (name !== pkg.name) {
                    saveField("name", name);
                    setPkg((p) => ({ ...p, name }));
                  }
                }}
              />
              <Badge className={GOAL_COLORS[pkg.fitnessGoal]}>
                {GOAL_LABELS[pkg.fitnessGoal]}
              </Badge>
            </div>

            <Textarea
              placeholder="Package description..."
              className="text-sm resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== (pkg.description || "")) {
                  saveField("description", description || null);
                  setPkg((p) => ({ ...p, description }));
                }
              }}
              rows={2}
            />
          </div>

          <div className="flex flex-col items-end gap-2">
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val);
                saveField("status", val);
                setPkg((p) => ({ ...p, status: val }));
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-xs text-muted-foreground">
              {configuredCount}/{pkg.variants.length} tiers configured
            </span>
          </div>
        </div>
      </div>

      {/* Tier variant builders */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Tier Variants</h2>
        <p className="text-sm text-muted-foreground">
          Configure the product bundle for each plan tier. Higher tiers get more
          credits, allowing you to add more products.
        </p>

        {pkg.variants.map((variant) => (
          <TierVariantBuilder
            key={variant.id}
            packageId={pkg.id}
            fitnessGoal={pkg.fitnessGoal}
            variantId={variant.id}
            tier={variant.subscriptionTier}
            initialProducts={variant.products}
            initialTotalCredits={variant.totalCreditsUsed}
            redemptionRules={redemptionRulesByTier[variant.subscriptionTierId] || []}
          />
        ))}

        {pkg.variants.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg">
            No active plan tiers found. Create plans first, then variants will
            be auto-created.
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Package</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{pkg.name}&rdquo; and all its
              tier variants. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

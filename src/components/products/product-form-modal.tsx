"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/types";
import { PRODUCT_CATEGORIES, SUB_CATEGORIES, REDEMPTION_TYPES } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatPercent,
  formatCurrency,
  calculateMargin,
  calculateLandedCost,
  getMarginColorClass,
} from "@/lib/utils";

interface ProductFormModalProps {
  product?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Record<string, unknown>) => void;
}

export function ProductFormModal({
  product,
  open,
  onOpenChange,
  onSave,
}: ProductFormModalProps) {
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "SUPPLEMENT" as string,
    subCategory: "",
    redemptionType: "Members Store" as string,
    retailPrice: "",
    costOfGoods: "",
    shippingCost: "",
    handlingCost: "",
    imageUrl: "",
    weightOz: "",
    tags: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      const p = product as Record<string, unknown>;
      setForm({
        name: product.name,
        sku: product.sku,
        category: product.category,
        subCategory: product.subCategory || "",
        redemptionType: product.redemptionType || "Members Store",
        retailPrice: String(product.retailPrice),
        costOfGoods: String(product.costOfGoods),
        shippingCost: String((p.shippingCost as number) ?? 0),
        handlingCost: String((p.handlingCost as number) ?? 0),
        imageUrl: product.imageUrl || "",
        weightOz: product.weightOz ? String(product.weightOz) : "",
        tags: product.tags.join(", "),
        isActive: product.isActive,
      });
    } else {
      setForm({
        name: "",
        sku: "",
        category: "SUPPLEMENT",
        subCategory: "",
        redemptionType: "Members Store",
        retailPrice: "",
        costOfGoods: "",
        shippingCost: "",
        handlingCost: "",
        imageUrl: "",
        weightOz: "",
        tags: "",
        isActive: true,
      });
    }
  }, [product, open]);

  const retail = parseFloat(form.retailPrice) || 0;
  const cogs = parseFloat(form.costOfGoods) || 0;
  const shippingNum = parseFloat(form.shippingCost) || 0;
  const handlingNum = parseFloat(form.handlingCost) || 0;
  const margin = retail > 0 ? calculateMargin(cogs, retail) : 0;
  const landedCost = calculateLandedCost(cogs, shippingNum, handlingNum);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: form.name,
        sku: form.sku,
        category: form.category,
        subCategory: form.subCategory || undefined,
        redemptionType: form.redemptionType,
        retailPrice: parseFloat(form.retailPrice),
        costOfGoods: parseFloat(form.costOfGoods),
        shippingCost: parseFloat(form.shippingCost) || 0,
        handlingCost: parseFloat(form.handlingCost) || 0,
        imageUrl: form.imageUrl || undefined,
        weightOz: form.weightOz ? parseFloat(form.weightOz) : undefined,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        isActive: form.isActive,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "New Product"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                required
                value={form.sku}
                onChange={(e) =>
                  setForm({ ...form, sku: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value, subCategory: "" })
                }
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="subCategory">Sub-Category</Label>
              <select
                id="subCategory"
                value={form.subCategory}
                onChange={(e) =>
                  setForm({ ...form, subCategory: e.target.value })
                }
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
              >
                <option value="">None</option>
                {(SUB_CATEGORIES[form.category] || []).map((sc) => (
                  <option key={sc} value={sc}>
                    {sc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="redemptionType">Redemption Type</Label>
            <select
              id="redemptionType"
              value={form.redemptionType}
              onChange={(e) =>
                setForm({ ...form, redemptionType: e.target.value })
              }
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
            >
              {REDEMPTION_TYPES.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="retailPrice">Retail Price</Label>
              <Input
                id="retailPrice"
                type="number"
                step="0.01"
                required
                value={form.retailPrice}
                onChange={(e) =>
                  setForm({ ...form, retailPrice: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="costOfGoods">COGS</Label>
              <Input
                id="costOfGoods"
                type="number"
                step="0.01"
                required
                value={form.costOfGoods}
                onChange={(e) =>
                  setForm({ ...form, costOfGoods: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingCost">Shipping Cost</Label>
              <Input
                id="shippingCost"
                type="number"
                step="0.01"
                value={form.shippingCost}
                onChange={(e) =>
                  setForm({ ...form, shippingCost: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="handlingCost">Handling / Fulfillment</Label>
              <Input
                id="handlingCost"
                type="number"
                step="0.01"
                value={form.handlingCost}
                onChange={(e) =>
                  setForm({ ...form, handlingCost: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {retail > 0 && cogs > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground">
                Margin:{" "}
                <Badge className={getMarginColorClass(margin)} variant="outline">
                  {formatPercent(margin)}
                </Badge>
              </span>
              {(shippingNum > 0 || handlingNum > 0) && (
                <span className="text-sm text-muted-foreground">
                  Landed: <strong>{formatCurrency(landedCost)}</strong>
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weightOz">Weight (oz)</Label>
              <Input
                id="weightOz"
                type="number"
                step="0.01"
                value={form.weightOz}
                onChange={(e) =>
                  setForm({ ...form, weightOz: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) =>
                  setForm({ ...form, tags: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : product ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

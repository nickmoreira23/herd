"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { PRODUCT_CATEGORIES, SUB_CATEGORIES, REDEMPTION_TYPES } from "@/types";
import { formatPercent, calculateMargin, getMarginColorClass, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ChevronDown,
  MoreHorizontal,
  Copy,
  Trash2,
  Check,
  Loader2,
  ExternalLink,
  Star,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

// ─── Types ──────────────────────────────────────────────────────────

export interface ProductFormState {
  name: string;
  sku: string;
  category: string;
  subCategory: string;
  redemptionType: string;
  retailPrice: string;
  memberPrice: string;
  costOfGoods: string;
  imageUrl: string;
  weightOz: string;
  tags: string;
  isActive: boolean;
  // Extended fields
  description: string;
  brand: string;
  sourceUrl: string;
  rescrapeInterval: string;
}

interface ProductImageRecord {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface SupplementFactLine {
  name: string;
  amount: string;
  unit: string;
  dailyValue: string | null;
}

interface ScrapedVariant {
  name: string;
  options: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────

function productToForm(product: Product): ProductFormState {
  const p = product as Record<string, unknown>;
  return {
    name: product.name,
    sku: product.sku,
    category: product.category,
    subCategory: (p.subCategory as string) || "",
    redemptionType: product.redemptionType,
    retailPrice: String(product.retailPrice),
    memberPrice: String(product.memberPrice),
    costOfGoods: String(product.costOfGoods),
    imageUrl: (p.imageUrl as string) || "",
    weightOz: p.weightOz != null ? String(p.weightOz) : "",
    tags: ((product.tags as string[]) || []).join(", "),
    isActive: product.isActive,
    description: (p.description as string) || "",
    brand: (p.brand as string) || "",
    sourceUrl: (p.sourceUrl as string) || "",
    rescrapeInterval: (p.rescrapeInterval as string) || "",
  };
}

function formToPayload(form: ProductFormState) {
  return {
    name: form.name,
    sku: form.sku,
    category: form.category,
    subCategory: form.subCategory || undefined,
    redemptionType: form.redemptionType,
    retailPrice: parseFloat(form.retailPrice) || 0,
    memberPrice: parseFloat(form.memberPrice) || 0,
    costOfGoods: parseFloat(form.costOfGoods) || 0,
    imageUrl: form.imageUrl || undefined,
    weightOz: form.weightOz ? parseFloat(form.weightOz) : undefined,
    tags: form.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    isActive: form.isActive,
    description: form.description || undefined,
    brand: form.brand || undefined,
    sourceUrl: form.sourceUrl || undefined,
    rescrapeInterval: form.rescrapeInterval || null,
  };
}

function toSlug(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function activeBadge(isActive: boolean) {
  if (isActive) {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] px-1.5 py-0">
        Active
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[11px] px-1.5 py-0">
      Inactive
    </Badge>
  );
}

// ─── Collapsible Section ───────────────────────────────────────────

function CollapsibleSection({
  title,
  description,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  description: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <CardHeader
        className="border-b cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {title}
              {count != null && ` (${count})`}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </div>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  );
}

// ─── Props ──────────────────────────────────────────────────────────

interface ProductDetailClientProps {
  productId?: string;
  initialProduct?: Product;
}

// ─── Component ──────────────────────────────────────────────────────

export function ProductDetailClient({
  productId,
  initialProduct,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormState>(
    initialProduct ? productToForm(initialProduct) : DEFAULT_FORM
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [autoSku, setAutoSku] = useState(!productId);

  // Dirty state tracking
  const initialFormRef = useRef<ProductFormState>(
    initialProduct ? productToForm(initialProduct) : DEFAULT_FORM
  );
  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialFormRef.current),
    [form]
  );

  // Duplicate modal
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function updateForm(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Computed pricing values
  const retailNum = parseFloat(form.retailPrice) || 0;
  const costNum = parseFloat(form.costOfGoods) || 0;
  const memberNum = parseFloat(form.memberPrice) || 0;
  const margin = retailNum > 0 ? calculateMargin(costNum, memberNum) : 0;

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return;

    // Create mode
    if (!productId) {
      if (!form.sku.trim()) {
        toast.error("SKU is required");
        return;
      }
      setSaving(true);
      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formToPayload(form)),
        });
        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error || "Failed to create product");
          return;
        }
        const json = await res.json();
        toast.success("Product created");
        router.push(`/admin/products/${json.data.id}`);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Edit mode
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form)),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to save");
        return;
      }
      setSaved(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2000);
      initialFormRef.current = { ...form };
      router.refresh();
    } finally {
      setSaving(false);
    }
  }, [form, productId, router]);

  const handleDuplicate = useCallback(async () => {
    if (!duplicateName.trim()) {
      toast.error("Enter a name for the duplicate");
      return;
    }
    setDuplicating(true);
    try {
      const payload = formToPayload(form);
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          name: duplicateName.trim(),
          sku: `${form.sku}-COPY-${Date.now()}`,
          isActive: false,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to duplicate");
        return;
      }
      const newProduct = await res.json();
      toast.success("Product duplicated");
      setDuplicateOpen(false);
      setDuplicateName("");
      router.push(`/admin/products/${newProduct.data.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDuplicating(false);
    }
  }, [duplicateName, form, router]);

  const handleDelete = useCallback(async () => {
    if (!productId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to delete");
        return;
      }
      toast.success("Product deleted");
      setDeleteOpen(false);
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }, [productId, router]);

  // Available sub-categories based on selected category
  const subCategoryOptions = SUB_CATEGORIES[form.category] || [];

  // Extended product data (read from initialProduct, not editable in form)
  const p = initialProduct as Record<string, unknown> | undefined;
  const productImages: ProductImageRecord[] = (p?.images as ProductImageRecord[]) || [];
  const supplementFacts: SupplementFactLine[] = (p?.supplementFacts as SupplementFactLine[]) || [];
  const productIngredients = (p?.ingredients as string) || null;
  const productWarnings = (p?.warnings as string) || null;
  const productServingSize = (p?.servingSize as string) || null;
  const productServingsPerContainer = (p?.servingsPerContainer as number) || null;
  const productVariants: ScrapedVariant[] = (p?.variants as ScrapedVariant[]) || [];
  const productLastScrapedAt = (p?.lastScrapedAt as string) || null;

  // Image management state
  const [images, setImages] = useState<ProductImageRecord[]>(productImages);
  const [imageLoading, setImageLoading] = useState<string | null>(null);

  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      if (!productId) return;
      setImageLoading(imageId);
      try {
        const res = await fetch(`/api/products/${productId}/images/${imageId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          toast.error("Failed to delete image");
          return;
        }
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        toast.success("Image deleted");
      } finally {
        setImageLoading(null);
      }
    },
    [productId]
  );

  const handleSetPrimary = useCallback(
    async (imageId: string) => {
      if (!productId) return;
      setImageLoading(imageId);
      try {
        const res = await fetch(`/api/products/${productId}/images/${imageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPrimary: true }),
        });
        if (!res.ok) {
          toast.error("Failed to set primary image");
          return;
        }
        setImages((prev) =>
          prev.map((img) => ({ ...img, isPrimary: img.id === imageId }))
        );
        toast.success("Primary image updated");
      } finally {
        setImageLoading(null);
      }
    },
    [productId]
  );

  const handleMoveImage = useCallback(
    async (imageId: string, direction: "up" | "down") => {
      if (!productId) return;
      const idx = images.findIndex((img) => img.id === imageId);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= images.length) return;

      const newImages = [...images];
      [newImages[idx], newImages[swapIdx]] = [newImages[swapIdx], newImages[idx]];
      const reordered = newImages.map((img, i) => ({ ...img, sortOrder: i }));
      setImages(reordered);

      try {
        await fetch(`/api/products/${productId}/images/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: reordered.map((img) => ({ id: img.id, sortOrder: img.sortOrder })),
          }),
        });
      } catch {
        toast.error("Failed to reorder images");
      }
    },
    [productId, images]
  );

  return (
    <div className="flex flex-col -m-6 min-h-[100vh]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b py-3 px-4">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/products"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Products
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium">
            {form.name || "New Product"}
          </span>
          <div className="ml-1">{activeBadge(form.isActive)}</div>
        </nav>

        <div className="flex items-center gap-2">
          {/* Active toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted-foreground">
              {form.isActive ? "Active" : "Inactive"}
            </span>
            <Switch
              checked={form.isActive}
              onCheckedChange={(val) => updateForm("isActive", val)}
            />
          </label>

          {/* Save button */}
          <Button
            size="sm"
            className="bg-[#C5F135] text-black hover:bg-[#C5F135]/90"
            onClick={handleSave}
            disabled={saving || (!isDirty && !!productId)}
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
            ) : productId ? (
              "Save"
            ) : (
              "Create"
            )}
          </Button>

          {/* Actions menu */}
          {productId && (
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
        <div className="max-w-[800px] mx-auto space-y-6">
          {/* Overview */}
          <CollapsibleSection title="Overview" description="Basic product information and classification.">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-name">Name</Label>
                  <Input
                    id="product-name"
                    value={form.name}
                    onChange={(e) => {
                      updateForm("name", e.target.value);
                      if (autoSku) updateForm("sku", toSlug(e.target.value));
                    }}
                    placeholder="Whey Protein Isolate"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="product-sku">SKU</Label>
                  <Input
                    id="product-sku"
                    value={form.sku}
                    onChange={(e) => {
                      setAutoSku(false);
                      updateForm("sku", e.target.value);
                    }}
                    placeholder="WHEY-ISO-001"
                    className="mt-2 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="product-brand">Brand</Label>
                <Input
                  id="product-brand"
                  value={form.brand}
                  onChange={(e) => updateForm("brand", e.target.value)}
                  placeholder="e.g., Bucked Up"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(val) => {
                      updateForm("category", val);
                      updateForm("subCategory", "");
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c.charAt(0) + c.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sub-Category</Label>
                  <Select
                    value={form.subCategory}
                    onValueChange={(val) => updateForm("subCategory", val)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategoryOptions.map((sc) => (
                        <SelectItem key={sc} value={sc}>
                          {sc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Redemption Type</Label>
                  <Select
                    value={form.redemptionType}
                    onValueChange={(val) => updateForm("redemptionType", val)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REDEMPTION_TYPES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Pricing */}
          <CollapsibleSection title="Pricing" description="Set retail, member, and cost pricing for this product.">
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="product-retail">Retail Price</Label>
                  <InputGroup className="mt-2">
                    <InputGroupAddon align="inline-start">$</InputGroupAddon>
                    <InputGroupInput
                      id="product-retail"
                      type="number"
                      step="0.01"
                      value={form.retailPrice}
                      onChange={(e) => updateForm("retailPrice", e.target.value)}
                      placeholder="0.00"
                    />
                  </InputGroup>
                </div>
                <div>
                  <Label htmlFor="product-member">Member Price</Label>
                  <InputGroup className="mt-2">
                    <InputGroupAddon align="inline-start">$</InputGroupAddon>
                    <InputGroupInput
                      id="product-member"
                      type="number"
                      step="0.01"
                      value={form.memberPrice}
                      onChange={(e) => updateForm("memberPrice", e.target.value)}
                      placeholder="0.00"
                    />
                  </InputGroup>
                </div>
                <div>
                  <Label htmlFor="product-cogs">Cost of Goods</Label>
                  <InputGroup className="mt-2">
                    <InputGroupAddon align="inline-start">$</InputGroupAddon>
                    <InputGroupInput
                      id="product-cogs"
                      type="number"
                      step="0.01"
                      value={form.costOfGoods}
                      onChange={(e) => updateForm("costOfGoods", e.target.value)}
                      placeholder="0.00"
                    />
                  </InputGroup>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Member Price: <strong>{formatCurrency(memberNum)}</strong>
                </span>
                <span className="text-muted-foreground">
                  Margin:{" "}
                  <Badge className={`${getMarginColorClass(margin)} text-[11px] px-1.5 py-0`}>
                    {formatPercent(margin)}
                  </Badge>
                </span>
              </div>
            </div>
          </CollapsibleSection>

          {/* Details */}
          <CollapsibleSection title="Details" description="Additional product details, images, weight, and tags.">
            <div className="space-y-4">
              {/* Image Gallery */}
              {images.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Product Images ({images.length})
                  </Label>
                  <div className="grid grid-cols-4 gap-3 mt-2">
                    {images.map((img, idx) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.url}
                          alt={img.alt || "Product image"}
                          className={cn(
                            "w-full aspect-square rounded-lg object-cover border",
                            img.isPrimary && "ring-2 ring-primary"
                          )}
                        />
                        {img.isPrimary && (
                          <Badge className="absolute top-1.5 left-1.5 text-[9px] px-1 py-0 bg-primary text-primary-foreground">
                            Primary
                          </Badge>
                        )}
                        {/* Image management controls */}
                        <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {!img.isPrimary && (
                            <button
                              type="button"
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-white hover:bg-white/20 transition-colors"
                              onClick={() => handleSetPrimary(img.id)}
                              disabled={imageLoading === img.id}
                              title="Set as primary"
                            >
                              <Star className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-white hover:bg-white/20 transition-colors disabled:opacity-30"
                            onClick={() => handleMoveImage(img.id, "up")}
                            disabled={imageLoading === img.id || idx === 0}
                            title="Move up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-white hover:bg-white/20 transition-colors disabled:opacity-30"
                            onClick={() => handleMoveImage(img.id, "down")}
                            disabled={imageLoading === img.id || idx === images.length - 1}
                            title="Move down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-red-400 hover:bg-white/20 transition-colors"
                            onClick={() => handleDeleteImage(img.id)}
                            disabled={imageLoading === img.id}
                            title="Delete image"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-image">Image URL</Label>
                  <Input
                    id="product-image"
                    value={form.imageUrl}
                    onChange={(e) => updateForm("imageUrl", e.target.value)}
                    placeholder="https://..."
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="product-weight">Weight (oz)</Label>
                  <Input
                    id="product-weight"
                    type="number"
                    step="0.01"
                    value={form.weightOz}
                    onChange={(e) => updateForm("weightOz", e.target.value)}
                    placeholder="0.00"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="product-tags">Tags</Label>
                <Input
                  id="product-tags"
                  value={form.tags}
                  onChange={(e) => updateForm("tags", e.target.value)}
                  placeholder="protein, isolate, vanilla"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">Separate tags with commas.</p>
              </div>

              <div>
                <Label htmlFor="product-description">Description</Label>
                <textarea
                  id="product-description"
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  rows={4}
                  placeholder="Product description..."
                  className="mt-2 flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Supplement Info */}
          {productId && (supplementFacts.length > 0 || productIngredients || productServingSize) && (
            <CollapsibleSection title="Supplement Info" description="Nutritional facts, ingredients, and serving information.">
              <div className="space-y-4">
                {(productServingSize || productServingsPerContainer) && (
                  <div className="flex gap-6 text-sm">
                    {productServingSize && (
                      <div>
                        <span className="text-muted-foreground">Serving Size:</span>{" "}
                        <span className="font-medium">{productServingSize}</span>
                      </div>
                    )}
                    {productServingsPerContainer && (
                      <div>
                        <span className="text-muted-foreground">Servings per Container:</span>{" "}
                        <span className="font-medium">{productServingsPerContainer}</span>
                      </div>
                    )}
                  </div>
                )}

                {supplementFacts.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-3 py-2 font-medium">Ingredient</th>
                          <th className="text-right px-3 py-2 font-medium">Amount</th>
                          <th className="text-right px-3 py-2 font-medium">% Daily Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplementFacts.map((fact, idx) => (
                          <tr key={idx} className="border-t border-border/50">
                            <td className="px-3 py-1.5">{fact.name}</td>
                            <td className="text-right px-3 py-1.5 tabular-nums">
                              {fact.amount}{fact.unit}
                            </td>
                            <td className="text-right px-3 py-1.5 tabular-nums text-muted-foreground">
                              {fact.dailyValue || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {productIngredients && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Ingredients</Label>
                    <p className="text-sm leading-relaxed mt-1">{productIngredients}</p>
                  </div>
                )}

                {productWarnings && (
                  <div>
                    <Label className="text-xs text-amber-500">Warnings</Label>
                    <p className="text-sm leading-relaxed text-muted-foreground mt-1">{productWarnings}</p>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Variants */}
          {productId && productVariants.length > 0 && (
            <CollapsibleSection title="Variants" description="Available product variants and options.">
              <div className="space-y-3">
                {productVariants.map((v) => (
                  <div key={v.name}>
                    <Label className="text-xs text-muted-foreground">{v.name}</Label>
                    <ol className="list-decimal list-inside mt-1 space-y-0.5">
                      {v.options.map((opt, idx) => (
                        <li key={idx} className="text-sm text-foreground">
                          {opt}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Source */}
          {productId && form.sourceUrl && (
            <CollapsibleSection title="Source" description="Where this product was imported from.">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <a
                    href={form.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {form.sourceUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {productLastScrapedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last scraped: {new Date(productLastScrapedAt).toLocaleDateString()}
                  </p>
                )}

                {/* Re-scrape scheduling */}
                <div className="pt-2 border-t">
                  <Label>Re-scrape Schedule</Label>
                  <Select
                    value={form.rescrapeInterval || "OFF"}
                    onValueChange={(val) =>
                      updateForm("rescrapeInterval", val === "OFF" ? "" : val)
                    }
                  >
                    <SelectTrigger className="mt-2 w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OFF">Off</SelectItem>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically re-scrape this product on a schedule.
                  </p>
                </div>
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Duplicate Product
            </DialogTitle>
            <DialogDescription>
              Create a copy of this product with a new name. All configuration will
              be duplicated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Name</label>
            <Input
              placeholder="Product name..."
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
              Delete Product
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{form.name}</strong>? This
              action cannot be undone.
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

// ─── Default form for new products ─────────────────────────────────────

const DEFAULT_FORM: ProductFormState = {
  name: "",
  sku: "",
  category: "SUPPLEMENT",
  subCategory: "",
  redemptionType: "Members Store",
  retailPrice: "",
  memberPrice: "",
  costOfGoods: "",
  imageUrl: "",
  weightOz: "",
  tags: "",
  isActive: true,
  description: "",
  brand: "",
  sourceUrl: "",
  rescrapeInterval: "",
};

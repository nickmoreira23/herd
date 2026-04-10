"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link2, Loader2, ChevronDown, ChevronRight, Package } from "lucide-react";
import { toast } from "sonner";
import type { ScrapedProductData } from "@/lib/products/types";
import { PRODUCT_CATEGORIES, SUB_CATEGORIES } from "@/types";

interface ProductUrlImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface FormOverrides {
  name: string;
  sku: string;
  brand: string;
  category: string;
  subCategory: string;
  retailPrice: string;
  costOfGoods: string;
  tags: string;
  description: string;
}

function toSlug(name: string, brand?: string): string {
  const prefix = brand ? `${brand}-` : "";
  return (prefix + name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export function ProductUrlImportModal({
  open,
  onOpenChange,
  onComplete,
}: ProductUrlImportModalProps) {
  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState<ScrapedProductData | null>(null);
  const [form, setForm] = useState<FormOverrides>({
    name: "",
    sku: "",
    brand: "",
    category: "SUPPLEMENT",
    subCategory: "",
    retailPrice: "",
    costOfGoods: "",
    tags: "",
    description: "",
  });
  const [importing, setImporting] = useState(false);
  const [showSupplementDetails, setShowSupplementDetails] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  function reset() {
    setUrl("");
    setScraping(false);
    setScraped(null);
    setForm({
      name: "",
      sku: "",
      brand: "",
      category: "SUPPLEMENT",
      subCategory: "",
      retailPrice: "",
      costOfGoods: "",
      tags: "",
      description: "",
    });
    setImporting(false);
    setShowSupplementDetails(false);
    setSelectedImageIdx(0);
  }

  async function handleScrape() {
    if (!url.trim()) {
      toast.error("URL is required");
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setScraping(true);
    try {
      const res = await fetch("/api/products/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || "Failed to scrape URL");
        return;
      }

      const { data } = await res.json();
      setScraped(data);
      setSelectedImageIdx(0);

      // Pre-fill form with scraped data
      const scrapedName = data.name || "";
      setForm({
        name: scrapedName,
        sku: data.sku || toSlug(scrapedName, data.brand),
        brand: data.brand || "",
        category: "SUPPLEMENT",
        subCategory: "",
        retailPrice: data.price ? String(data.price) : "",
        costOfGoods: "",
        tags: (data.tags || []).join(", "),
        description: data.description || "",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scrape failed");
    } finally {
      setScraping(false);
    }
  }

  async function handleImport() {
    if (!scraped) return;
    if (!form.name || !form.sku || !form.retailPrice || !form.costOfGoods) {
      toast.error("Please fill in Name, SKU, Retail Price, and COGS");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/products/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          category: form.category,
          subCategory: form.subCategory || undefined,
          retailPrice: parseFloat(form.retailPrice),
          costOfGoods: parseFloat(form.costOfGoods),
          brand: form.brand || undefined,
          description: form.description || undefined,
          sourceUrl: scraped.sourceUrl,
          imageUrl: scraped.images[0]?.url || undefined,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          variants: scraped.variants.length > 0 ? scraped.variants : undefined,
          servingSize: scraped.servingSize || undefined,
          servingsPerContainer: scraped.servingsPerContainer || undefined,
          ingredients: scraped.ingredients || undefined,
          supplementFacts: scraped.supplementFacts.length > 0 ? scraped.supplementFacts : undefined,
          warnings: scraped.warnings || undefined,
          images: scraped.images.map((img, idx) => ({
            url: img.url,
            alt: img.alt,
            isPrimary: idx === 0,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || "Failed to import product");
        return;
      }

      toast.success(`Product "${form.name}" imported successfully`);
      reset();
      onOpenChange(false);
      onComplete();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const canImport =
    !!form.name && !!form.sku && !!form.retailPrice && !!form.costOfGoods;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!scraping && !importing) {
          onOpenChange(v);
          if (!v) reset();
        }
      }}
    >
      <DialogContent
        className={`transition-[max-width] duration-300 ${
          scraped ? "sm:max-w-3xl" : "sm:max-w-md"
        }`}
      >
        <DialogHeader>
          <DialogTitle>Import Product via URL</DialogTitle>
        </DialogHeader>

        {/* Step 1: URL Input */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Product URL</Label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.buckedup.com/woke-af-..."
                type="url"
                disabled={scraping}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleScrape();
                }}
              />
              <Button
                onClick={handleScrape}
                disabled={scraping || !url.trim()}
                size="sm"
                className="shrink-0"
              >
                {scraping ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
                {scraping ? "Scraping..." : "Scrape"}
              </Button>
            </div>
          </div>
        </div>

        {/* Step 2: Preview & Edit */}
        {scraped && (
          <div className="mt-2 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Image gallery preview */}
            {scraped.images.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Images ({scraped.images.length})</Label>
                <div className="flex gap-3">
                  {/* Large selected image */}
                  <div className="shrink-0">
                    <img
                      src={scraped.images[selectedImageIdx]?.url}
                      alt={scraped.images[selectedImageIdx]?.alt || "Product image"}
                      className="h-36 w-36 rounded-lg object-cover border"
                    />
                  </div>
                  {/* Thumbnail strip */}
                  {scraped.images.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 content-start">
                      {scraped.images.slice(0, 12).map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImageIdx(idx)}
                          className={`h-10 w-10 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                            idx === selectedImageIdx
                              ? "border-primary ring-1 ring-primary/30"
                              : "border-transparent hover:border-muted-foreground/30"
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={img.alt || `Image ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                      {scraped.images.length > 12 && (
                        <div className="h-10 w-10 rounded-md border border-dashed flex items-center justify-center shrink-0">
                          <span className="text-[9px] text-muted-foreground">
                            +{scraped.images.length - 12}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Editable form fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Brand</Label>
                <Input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">SKU *</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="h-8 text-sm font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <select
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Sub-Category</Label>
                <select
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
              <div className="space-y-1">
                <Label className="text-xs">Tags</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="Comma-separated"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">
                  Retail Price *{" "}
                  {scraped.price && (
                    <span className="text-muted-foreground font-normal">
                      (scraped: ${scraped.price})
                    </span>
                  )}
                </Label>
                <Input
                  value={form.retailPrice}
                  onChange={(e) =>
                    setForm({ ...form, retailPrice: e.target.value })
                  }
                  type="number"
                  step="0.01"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cost of Goods *</Label>
                <Input
                  value={form.costOfGoods}
                  onChange={(e) =>
                    setForm({ ...form, costOfGoods: e.target.value })
                  }
                  type="number"
                  step="0.01"
                  placeholder="Enter COGS"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Description */}
            {form.description && (
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm resize-none"
                />
              </div>
            )}

            {/* Variants */}
            {scraped.variants.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Variants</Label>
                <div className="flex flex-wrap gap-1.5">
                  {scraped.variants.map((v) => (
                    <div key={v.name} className="text-xs">
                      <span className="font-medium">{v.name}:</span>{" "}
                      {v.options.slice(0, 6).map((opt) => (
                        <Badge
                          key={opt}
                          variant="secondary"
                          className="text-[10px] mr-0.5"
                        >
                          {opt}
                        </Badge>
                      ))}
                      {v.options.length > 6 && (
                        <span className="text-muted-foreground">
                          +{v.options.length - 6} more
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supplement Details (collapsible) */}
            {(scraped.supplementFacts.length > 0 ||
              scraped.ingredients ||
              scraped.servingSize) && (
              <div className="border rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    setShowSupplementDetails(!showSupplementDetails)
                  }
                  className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-medium hover:bg-muted/50 rounded-lg"
                >
                  {showSupplementDetails ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  Supplement Details
                  {scraped.supplementFacts.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] ml-1">
                      {scraped.supplementFacts.length} facts
                    </Badge>
                  )}
                </button>

                {showSupplementDetails && (
                  <div className="px-3 pb-3 space-y-3">
                    {/* Serving info */}
                    {(scraped.servingSize ||
                      scraped.servingsPerContainer) && (
                      <div className="flex gap-4 text-xs">
                        {scraped.servingSize && (
                          <div>
                            <span className="text-muted-foreground">
                              Serving Size:
                            </span>{" "}
                            {scraped.servingSize}
                          </div>
                        )}
                        {scraped.servingsPerContainer && (
                          <div>
                            <span className="text-muted-foreground">
                              Servings:
                            </span>{" "}
                            {scraped.servingsPerContainer}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Supplement facts table */}
                    {scraped.supplementFacts.length > 0 && (
                      <div className="border rounded overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left px-2 py-1 font-medium">
                                Ingredient
                              </th>
                              <th className="text-right px-2 py-1 font-medium">
                                Amount
                              </th>
                              <th className="text-right px-2 py-1 font-medium">
                                % DV
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {scraped.supplementFacts.map((fact, idx) => (
                              <tr
                                key={idx}
                                className="border-t border-border/50"
                              >
                                <td className="px-2 py-1">{fact.name}</td>
                                <td className="text-right px-2 py-1 tabular-nums">
                                  {fact.amount}
                                  {fact.unit}
                                </td>
                                <td className="text-right px-2 py-1 tabular-nums text-muted-foreground">
                                  {fact.dailyValue || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Ingredients */}
                    {scraped.ingredients && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium">
                          Ingredients
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {scraped.ingredients}
                        </p>
                      </div>
                    )}

                    {/* Warnings */}
                    {scraped.warnings && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-amber-500">
                          Warnings
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {scraped.warnings}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {scraped && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setScraped(null);
              }}
              disabled={importing}
              size="sm"
            >
              Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || !canImport}
              size="sm"
            >
              {importing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Package className="h-3.5 w-3.5 mr-1.5" />
                  Import Product
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

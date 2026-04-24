"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeCreditCost, resolveDiscount, type RedemptionRule } from "@/lib/credit-cost";
import { PriceBreakdown } from "./price-breakdown";

interface SearchProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  subCategory: string | null;
  retailPrice: number;
  memberPrice: number;
  imageUrl: string | null;
  costOfGoods: number;
  shippingCost: number;
  handlingCost: number;
  paymentProcessingPct: number;
  paymentProcessingFlat: number;
}

interface ProductPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redemptionRules: RedemptionRule[];
  existingProductIds: Set<string>;
  onAddProduct: (product: SearchProduct, creditCost: number) => void;
}

const CATEGORIES = ["ALL", "SUPPLEMENT", "APPAREL", "ACCESSORY"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  SUPPLEMENT: "bg-emerald-100 text-emerald-700",
  APPAREL: "bg-blue-100 text-blue-700",
  ACCESSORY: "bg-purple-100 text-purple-700",
};

export function ProductPicker({
  open,
  onOpenChange,
  redemptionRules,
  existingProductIds,
  onAddProduct,
}: ProductPickerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchProducts = useCallback(
    async (searchQuery: string, cat: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("q", searchQuery);
        if (cat !== "ALL") params.set("category", cat);
        const res = await fetch(`/api/products/search?${params}`);
        if (res.ok) {
          const json = await res.json();
          setProducts(json.data || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Reset and fetch when dialog opens
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCategory("ALL");
    fetchProducts("", "ALL");
  }, [open, fetchProducts]);

  function handleSearch(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts(value, category);
    }, 300);
  }

  // Plain function — no Base UI Tabs involved, avoids dialog-close interference
  function handleCategoryChange(cat: string) {
    setCategory(cat);
    fetchProducts(query, cat);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        sm:max-w-5xl overrides the DialogContent base sm:max-w-sm so the
        dialog actually expands at the sm breakpoint instead of being capped
        at 384px.
      */}
      <DialogContent className="sm:max-w-[960px] max-h-[85vh] flex flex-col gap-3 p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name or SKU..."
            className="pl-9"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/*
          Plain button segmented control instead of Base UI <Tabs>.
          Radix/Base UI Tabs dispatch events that bubble up to the Dialog's
          backdrop dismiss handler, causing it to flash closed then reopen.
          Plain <button> elements have no such interaction.
        */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg shrink-0">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCategoryChange(c);
              }}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 cursor-pointer",
                category === c
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {c === "ALL" ? "All" : c.charAt(0) + c.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-10 text-sm text-muted-foreground">
              No products found.
            </div>
          )}

          {!loading && (
            <div className="space-y-1">
              {products.map((product) => {
                const isAdded = existingProductIds.has(product.id);
                const creditCost = computeCreditCost(
                  {
                    sku: product.sku,
                    category: product.category,
                    subCategory: product.subCategory,
                    memberPrice: product.memberPrice,
                  },
                  redemptionRules
                );

                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-colors"
                  >
                    {/* Product image */}
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-14 w-14 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-zinc-100 flex items-center justify-center text-xs text-muted-foreground shrink-0">
                        N/A
                      </div>
                    )}

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">
                          {product.sku}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-xs shrink-0 ${CATEGORY_COLORS[product.category] || ""}`}
                        >
                          {product.category}
                        </Badge>
                        {product.subCategory && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {product.subCategory}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price + action */}
                    <div className="flex items-center gap-4 shrink-0">
                      <PriceBreakdown
                        memberPrice={product.memberPrice}
                        creditCost={creditCost}
                        discountPercent={resolveDiscount(
                          {
                            sku: product.sku,
                            category: product.category,
                            subCategory: product.subCategory,
                            memberPrice: product.memberPrice,
                          },
                          redemptionRules
                        )}
                        variant="full"
                      />
                      <Button
                        size="sm"
                        variant={isAdded ? "secondary" : "default"}
                        disabled={isAdded}
                        onClick={() => onAddProduct(product, creditCost)}
                        className="w-20 shrink-0"
                      >
                        {isAdded ? (
                          "Added"
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

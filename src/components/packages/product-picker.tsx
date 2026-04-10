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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (!open) return;
    fetchProducts("", "ALL");
  }, [open, fetchProducts]);

  function handleSearch(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts(value, category);
    }, 300);
  }

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    fetchProducts(query, cat);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name or SKU..."
            className="pl-9"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Category tabs */}
        <Tabs value={category} onValueChange={handleCategoryChange}>
          <TabsList className="w-full">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c} className="flex-1">
                {c === "ALL" ? "All" : c.charAt(0) + c.slice(1).toLowerCase()}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No products found.
            </div>
          )}

          {!loading &&
            products.map((product) => {
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
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-zinc-100 flex items-center justify-center text-xs text-muted-foreground">
                        N/A
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {product.sku}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${CATEGORY_COLORS[product.category] || ""}`}
                        >
                          {product.category}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <PriceBreakdown
                      memberPrice={product.memberPrice}
                      creditCost={creditCost}
                      discountPercent={resolveDiscount(
                        { sku: product.sku, category: product.category, subCategory: product.subCategory, memberPrice: product.memberPrice },
                        redemptionRules
                      )}
                      variant="full"
                    />
                    <Button
                      size="sm"
                      variant={isAdded ? "secondary" : "default"}
                      disabled={isAdded}
                      onClick={() => onAddProduct(product, creditCost)}
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
      </DialogContent>
    </Dialog>
  );
}

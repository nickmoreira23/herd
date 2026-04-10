"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CreditBudgetBar } from "./credit-budget-bar";
import { ProductPicker } from "./product-picker";
import { AiSuggestionPanel } from "./ai-suggestion-panel";
import { computeCreditCost, resolveDiscount, type RedemptionRule } from "@/lib/credit-cost";
import { PriceBreakdown } from "./price-breakdown";

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

interface TierInfo {
  id: string;
  name: string;
  slug: string;
  monthlyCredits: number;
  monthlyPrice: number;
  colorAccent: string;
  sortOrder: number;
  iconUrl: string | null;
}

interface TierVariantBuilderProps {
  packageId: string;
  fitnessGoal: string;
  variantId: string;
  tier: TierInfo;
  initialProducts: ProductInVariant[];
  initialTotalCredits: number;
  redemptionRules: RedemptionRule[];
}

const CATEGORY_COLORS: Record<string, string> = {
  SUPPLEMENT: "bg-emerald-100 text-emerald-700",
  APPAREL: "bg-blue-100 text-blue-700",
  ACCESSORY: "bg-purple-100 text-purple-700",
};

// ─── Component ────────────────────────────────────────────────

export function TierVariantBuilder({
  packageId,
  fitnessGoal,
  variantId,
  tier,
  initialProducts,
  initialTotalCredits,
  redemptionRules,
}: TierVariantBuilderProps) {
  const [products, setProducts] = useState<ProductInVariant[]>(initialProducts);
  const [totalCredits, setTotalCredits] = useState(initialTotalCredits);
  const [showPicker, setShowPicker] = useState(false);
  const [savingProduct, setSavingProduct] = useState<string | null>(null);

  const existingProductIds = new Set(products.map((p) => p.productId));

  const recalcTotal = useCallback((items: ProductInVariant[]) => {
    return items.reduce((sum, p) => sum + p.creditCost * p.quantity, 0);
  }, []);

  // Add product via API
  const handleAddProduct = useCallback(
    async (
      product: { id: string; name: string; sku: string; category: string; subCategory: string | null; memberPrice: number; imageUrl: string | null; retailPrice: number },
      creditCost: number
    ) => {
      setSavingProduct(product.id);
      try {
        const res = await fetch(
          `/api/packages/${packageId}/variants/${tier.id}/products`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: product.id,
              quantity: 1,
              creditCost,
            }),
          }
        );

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          toast.error(json?.error || "Failed to add product");
          return;
        }

        const json = await res.json();
        // Use server-computed creditCost if available
        const finalCreditCost = json.data.creditCost ?? creditCost;
        const newProduct: ProductInVariant = {
          id: crypto.randomUUID(),
          productId: product.id,
          quantity: 1,
          creditCost: finalCreditCost,
          sortOrder: products.length,
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            subCategory: product.subCategory,
            retailPrice: product.retailPrice,
            memberPrice: product.memberPrice,
            imageUrl: product.imageUrl,
          },
        };

        const updated = [...products, newProduct];
        setProducts(updated);
        setTotalCredits(json.data.totalCreditsUsed);
        toast.success(`Added ${product.name}`);
      } catch {
        toast.error("Failed to add product");
      } finally {
        setSavingProduct(null);
      }
    },
    [packageId, tier.id, products]
  );

  // Remove product via API
  const handleRemoveProduct = useCallback(
    async (productId: string) => {
      setSavingProduct(productId);
      try {
        const res = await fetch(
          `/api/packages/${packageId}/variants/${tier.id}/products?productId=${productId}`,
          { method: "DELETE" }
        );

        if (!res.ok) {
          toast.error("Failed to remove product");
          return;
        }

        const json = await res.json();
        const updated = products.filter((p) => p.productId !== productId);
        setProducts(updated);
        setTotalCredits(json.data.totalCreditsUsed);
      } catch {
        toast.error("Failed to remove product");
      } finally {
        setSavingProduct(null);
      }
    },
    [packageId, tier.id, products]
  );

  // Update quantity via PUT (replace all)
  const handleQuantityChange = useCallback(
    async (productId: string, delta: number) => {
      const updated = products.map((p) =>
        p.productId === productId
          ? { ...p, quantity: Math.max(1, p.quantity + delta) }
          : p
      );
      setProducts(updated);
      const newTotal = recalcTotal(updated);
      setTotalCredits(newTotal);

      // Save via PUT
      try {
        await fetch(
          `/api/packages/${packageId}/variants/${tier.id}/products`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              products: updated.map((p) => ({
                productId: p.productId,
                quantity: p.quantity,
                creditCost: p.creditCost,
              })),
            }),
          }
        );
      } catch {
        // silent — optimistic update already applied
      }
    },
    [packageId, tier.id, products, recalcTotal]
  );

  // Accept AI suggestions
  const handleAcceptAiProducts = useCallback(
    async (
      aiProducts: { productId: string; name: string; quantity: number; creditCost: number }[]
    ) => {
      // Filter out already-added products
      const newOnes = aiProducts.filter(
        (p) => !existingProductIds.has(p.productId)
      );
      if (newOnes.length === 0) {
        toast.info("All suggested products are already in this variant");
        return;
      }

      // Build full products list
      const allProducts = [
        ...products.map((p) => ({
          productId: p.productId,
          quantity: p.quantity,
          creditCost: p.creditCost,
        })),
        ...newOnes.map((p) => ({
          productId: p.productId,
          quantity: p.quantity,
          creditCost: p.creditCost,
        })),
      ];

      try {
        const res = await fetch(
          `/api/packages/${packageId}/variants/${tier.id}/products`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ products: allProducts }),
          }
        );

        if (!res.ok) {
          toast.error("Failed to save AI suggestions");
          return;
        }

        // Refresh from the API response
        const json = await res.json();
        if (json.data?.variant?.products) {
          setProducts(json.data.variant.products);
        }
        setTotalCredits(json.data.totalCreditsUsed);
        toast.success(`Added ${newOnes.length} product${newOnes.length !== 1 ? "s" : ""} from AI`);
      } catch {
        toast.error("Failed to save AI suggestions");
      }
    },
    [packageId, tier.id, products, existingProductIds]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tier.iconUrl ? (
              <img
                src={tier.iconUrl}
                alt={tier.name}
                className="h-10 w-10 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground">
                {tier.name.charAt(0)}
              </div>
            )}
            <CardTitle className="text-base">{tier.name}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              ${tier.monthlyPrice}/mo
            </Badge>
          </div>
          <Badge variant="outline" className="text-xs">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Credit budget bar */}
        <CreditBudgetBar used={totalCredits} budget={tier.monthlyCredits} />

        {/* Product list */}
        {products.length > 0 && (
          <div className="space-y-2">
            {products.map((p) => (
              <div
                key={p.productId}
                className="flex items-center gap-3 p-2 rounded-lg bg-zinc-50 border border-zinc-100"
              >
                {p.product.imageUrl ? (
                  <img
                    src={p.product.imageUrl}
                    alt={p.product.name}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-zinc-200" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {p.product.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${CATEGORY_COLORS[p.product.category] || ""}`}
                    >
                      {p.product.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ${p.creditCost.toFixed(2)}/ea
                    </span>
                    {(() => {
                      const disc = resolveDiscount(
                        { sku: p.product.sku, category: p.product.category, subCategory: p.product.subCategory, memberPrice: p.product.memberPrice },
                        redemptionRules
                      );
                      return disc > 0 ? (
                        <span className="text-[10px] font-semibold px-1 py-px rounded-full bg-[#C5F135]/20 text-[#8BA620]">
                          -{disc}%
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleQuantityChange(p.productId, -1)}
                    disabled={p.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-6 text-center">
                    {p.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleQuantityChange(p.productId, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Line total */}
                <PriceBreakdown
                  memberPrice={p.product.memberPrice}
                  creditCost={p.creditCost}
                  discountPercent={resolveDiscount(
                    { sku: p.product.sku, category: p.product.category, subCategory: p.product.subCategory, memberPrice: p.product.memberPrice },
                    redemptionRules
                  )}
                  quantity={p.quantity}
                  className="w-20"
                />

                {/* Remove */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 hover:text-red-700"
                  onClick={() => handleRemoveProduct(p.productId)}
                  disabled={savingProduct === p.productId}
                >
                  {savingProduct === p.productId ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {products.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No products added yet. Use the button below or AI Suggest to get started.
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPicker(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Product
          </Button>

          <AiSuggestionPanel
            packageId={packageId}
            subscriptionTierId={tier.id}
            fitnessGoal={fitnessGoal}
            onAcceptProducts={handleAcceptAiProducts}
          />
        </div>

        <ProductPicker
          open={showPicker}
          onOpenChange={setShowPicker}
          redemptionRules={redemptionRules}
          existingProductIds={existingProductIds}
          onAddProduct={handleAddProduct}
        />
      </CardContent>
    </Card>
  );
}

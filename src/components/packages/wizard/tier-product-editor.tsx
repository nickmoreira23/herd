"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash2, Sparkles, Copy } from "lucide-react";
import { CreditBudgetBar } from "../credit-budget-bar";
import { ProductPicker } from "../product-picker";
import { computeCreditCost, resolveDiscount, type RedemptionRule } from "@/lib/credit-cost";
import { PriceBreakdown } from "../price-breakdown";
import {
  usePackageWizardStore,
  type TierInfo,
  type LocalProduct,
} from "@/stores/package-wizard-store";

const CATEGORY_COLORS: Record<string, string> = {
  SUPPLEMENT: "bg-emerald-100 text-emerald-700",
  APPAREL: "bg-blue-100 text-blue-700",
  ACCESSORY: "bg-purple-100 text-purple-700",
};

interface TierProductEditorProps {
  tier: TierInfo;
  redemptionRules: RedemptionRule[];
  onTriggerAi: () => void;
}

export function TierProductEditor({
  tier,
  redemptionRules,
  onTriggerAi,
}: TierProductEditorProps) {
  const {
    tierProducts,
    tiers,
    addProduct,
    removeProduct,
    updateQuantity,
    copyFromTier,
  } = usePackageWizardStore();

  const [showPicker, setShowPicker] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);

  const state = tierProducts[tier.id] ?? { products: [], totalCreditsUsed: 0 };
  const existingProductIds = new Set(state.products.map((p) => p.productId));

  // Find tiers with products that can be copied from (lower sortOrder)
  const copyableTiers = tiers.filter(
    (t) =>
      t.id !== tier.id &&
      t.sortOrder < tier.sortOrder &&
      (tierProducts[t.id]?.products.length ?? 0) > 0
  );

  function handleAddProduct(
    product: {
      id: string;
      name: string;
      sku: string;
      category: string;
      subCategory: string | null;
      memberPrice: number;
      imageUrl: string | null;
      retailPrice: number;
    },
    creditCost: number
  ) {
    const localProduct: LocalProduct = {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      subCategory: product.subCategory,
      imageUrl: product.imageUrl,
      memberPrice: product.memberPrice,
      retailPrice: product.retailPrice,
      quantity: 1,
      creditCost,
    };
    addProduct(tier.id, localProduct);
  }

  function handleCopy(sourceTierId: string) {
    copyFromTier(sourceTierId, tier.id);
    setShowCopyMenu(false);
  }

  return (
    <div className="space-y-4">
      {/* Credit budget bar */}
      <CreditBudgetBar used={state.totalCreditsUsed} budget={tier.monthlyCredits} />

      {/* Product list */}
      {state.products.length > 0 && (
        <div className="space-y-2">
          {state.products.map((p) => (
            <div
              key={p.productId}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 transition-all duration-200 hover:shadow-sm hover:-translate-y-px"
            >
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-9 w-9 rounded-md object-cover shrink-0"
                />
              ) : (
                <div className="h-9 w-9 rounded-md bg-zinc-200 shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${CATEGORY_COLORS[p.category] || ""}`}
                  >
                    {p.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ${p.creditCost.toFixed(2)}/ea
                  </span>
                  {(() => {
                    const disc = resolveDiscount(
                      { sku: p.sku, category: p.category, subCategory: p.subCategory, memberPrice: p.memberPrice },
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
                  onClick={() =>
                    updateQuantity(tier.id, p.productId, p.quantity - 1)
                  }
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
                  onClick={() =>
                    updateQuantity(tier.id, p.productId, p.quantity + 1)
                  }
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Line total */}
              <PriceBreakdown
                memberPrice={p.memberPrice}
                creditCost={p.creditCost}
                discountPercent={resolveDiscount(
                  { sku: p.sku, category: p.category, subCategory: p.subCategory, memberPrice: p.memberPrice },
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
                onClick={() => removeProduct(tier.id, p.productId)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {state.products.length === 0 && (
        <div className="text-center py-10 space-y-3">
          <div className="mx-auto h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No products yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add products manually or let AI suggest the best products for this tier.
            </p>
          </div>
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

        <Button
          variant="outline"
          size="sm"
          onClick={onTriggerAi}
          className="gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Suggestion
        </Button>

        {copyableTiers.length > 0 && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCopyMenu(!showCopyMenu)}
              className="gap-1.5 text-muted-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy from...
            </Button>
            {showCopyMenu && (
              <div className="absolute top-full left-0 mt-1 bg-card border rounded-lg shadow-md p-1 z-10 min-w-40">
                {copyableTiers.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors flex items-center gap-2"
                    onClick={() => handleCopy(t.id)}
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: t.colorAccent }}
                    />
                    {t.name}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {tierProducts[t.id]?.products.length ?? 0} products
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ProductPicker
        open={showPicker}
        onOpenChange={setShowPicker}
        redemptionRules={redemptionRules}
        existingProductIds={existingProductIds}
        onAddProduct={handleAddProduct}
      />
    </div>
  );
}

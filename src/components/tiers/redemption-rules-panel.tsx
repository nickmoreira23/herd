"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  X,
  Search,
  Store,
  CreditCard,
  Tag,
  FolderTree,
  Package,
  Loader2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { PRODUCT_CATEGORIES, SUB_CATEGORIES } from "@/types";

// ─── Types ────────────────────────────────────────────────────
interface RedemptionRule {
  id: string;
  subscriptionTierId: string;
  redemptionType: string;
  discountPercent: number;
  scopeType: string;
  scopeValue: string;
}

interface SearchProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  subCategory: string | null;
  retailPrice: number;
  costOfGoods: number;
  memberPrice: number;
  redemptionType: string;
}

interface PreviewProduct extends SearchProduct {
  discountApplied: number;
  effectivePrice: number;
  matchedRule: RedemptionRule;
}

// ─── Constants ────────────────────────────────────────────────
type ScopeTab = "CATEGORY" | "SUB_CATEGORY" | "SKU";

const SCOPE_LABELS: Record<ScopeTab, string> = {
  CATEGORY: "Category",
  SUB_CATEGORY: "Sub-Category",
  SKU: "Specific SKU",
};

const SCOPE_ICONS: Record<ScopeTab, React.ElementType> = {
  CATEGORY: Tag,
  SUB_CATEGORY: FolderTree,
  SKU: Package,
};

// ─── Main Component ──────────────────────────────────────────
interface RedemptionRulesPanelProps {
  tierId: string;
}

export function RedemptionRulesPanel({ tierId }: RedemptionRulesPanelProps) {
  const [rules, setRules] = useState<RedemptionRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch(`/api/subscriptions/${tierId}/redemption-rules`);
      if (res.ok) {
        const json = await res.json();
        setRules(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch rules:", e);
    } finally {
      setLoading(false);
    }
  }, [tierId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const storeRules = useMemo(
    () => rules.filter((r) => r.redemptionType === "MEMBERS_STORE"),
    [rules]
  );
  const rateRules = useMemo(
    () => rules.filter((r) => r.redemptionType === "MEMBERS_RATE"),
    [rules]
  );

  async function addRule(
    redemptionType: string,
    discountPercent: number,
    scopeType: string,
    scopeValue: string
  ) {
    try {
      const res = await fetch(`/api/subscriptions/${tierId}/redemption-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redemptionType, discountPercent, scopeType, scopeValue }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to add rule");
        return;
      }
      const json = await res.json();
      const count = json.data?.productsRecalculated;
      toast.success(count ? `Saved. Recalculated ${count} package product cost${count !== 1 ? "s" : ""}.` : "Saved");
      await fetchRules();
    } catch {
      toast.error("Failed to add rule");
    }
  }

  async function removeRule(ruleId: string) {
    // Optimistic remove
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    try {
      const res = await fetch(
        `/api/subscriptions/${tierId}/redemption-rules/${ruleId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        toast.error("Failed to remove rule");
        await fetchRules();
        return;
      }
      const json = await res.json();
      const count = json.data?.productsRecalculated;
      toast.success(count ? `Removed. Recalculated ${count} package product cost${count !== 1 ? "s" : ""}.` : "Removed");
    } catch {
      toast.error("Failed to remove rule");
      await fetchRules();
    }
  }

  async function updateDiscount(ruleId: string, discountPercent: number) {
    // Optimistic update
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, discountPercent } : r))
    );
    try {
      const res = await fetch(
        `/api/subscriptions/${tierId}/redemption-rules/${ruleId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discountPercent }),
        }
      );
      if (!res.ok) {
        toast.error("Failed to update discount");
        await fetchRules();
        return;
      }
      const json = await res.json();
      const count = json.data?.productsRecalculated;
      toast.success(count ? `Updated. Recalculated ${count} package product cost${count !== 1 ? "s" : ""}.` : "Updated");
    } catch {
      toast.error("Failed to update discount");
      await fetchRules();
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-8 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Redemption Rules</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure which products get discounted under each redemption type for this tier.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Column A — Members Store */}
        <RedemptionColumn
          title="Members Store"
          subtitle="Credits-based discount"
          type="MEMBERS_STORE"
          headerClass="bg-[#C5F135] text-black"
          accentClass="border-[#C5F135]/40"
          icon={Store}
          rules={storeRules}
          defaultDiscount={40}
          onAddRule={(discount, scopeType, scopeValue) =>
            addRule("MEMBERS_STORE", discount, scopeType, scopeValue)
          }
          onRemoveRule={removeRule}
          onUpdateDiscount={updateDiscount}
          tierId={tierId}
        />

        {/* Column B — Members Rate */}
        <RedemptionColumn
          title="Members Rate"
          subtitle="Flat membership discount"
          type="MEMBERS_RATE"
          headerClass="bg-blue-500 text-white"
          accentClass="border-blue-500/40"
          icon={CreditCard}
          rules={rateRules}
          defaultDiscount={20}
          onAddRule={(discount, scopeType, scopeValue) =>
            addRule("MEMBERS_RATE", discount, scopeType, scopeValue)
          }
          onRemoveRule={removeRule}
          onUpdateDiscount={updateDiscount}
          tierId={tierId}
        />
      </div>
    </div>
  );
}

// ─── Column Component ────────────────────────────────────────
interface RedemptionColumnProps {
  title: string;
  subtitle: string;
  type: string;
  headerClass: string;
  accentClass: string;
  icon: React.ElementType;
  rules: RedemptionRule[];
  defaultDiscount: number;
  onAddRule: (discount: number, scopeType: string, scopeValue: string) => void;
  onRemoveRule: (ruleId: string) => void;
  onUpdateDiscount: (ruleId: string, discount: number) => void;
  tierId: string;
}

function RedemptionColumn({
  title,
  subtitle,
  type,
  headerClass,
  accentClass,
  icon: Icon,
  rules,
  defaultDiscount,
  onAddRule,
  onRemoveRule,
  onUpdateDiscount,
  tierId,
}: RedemptionColumnProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [scopeTab, setScopeTab] = useState<ScopeTab>("CATEGORY");
  const [discount, setDiscount] = useState(String(defaultDiscount));
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  // SKU search state
  const [skuQuery, setSkuQuery] = useState("");
  const [skuResults, setSkuResults] = useState<SearchProduct[]>([]);
  const [skuSearching, setSkuSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function resetForm() {
    setDiscount(String(defaultDiscount));
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSkuQuery("");
    setSkuResults([]);
    setShowAddForm(false);
  }

  function handleAddCategory() {
    if (!selectedCategory) return;
    onAddRule(parseInt(discount) || defaultDiscount, "CATEGORY", selectedCategory);
    resetForm();
  }

  function handleAddSubCategory() {
    if (!selectedSubCategory) return;
    onAddRule(parseInt(discount) || defaultDiscount, "SUB_CATEGORY", selectedSubCategory);
    resetForm();
  }

  function handleAddSku(product: SearchProduct) {
    onAddRule(parseInt(discount) || defaultDiscount, "SKU", product.sku);
    resetForm();
  }

  // Debounced SKU search
  useEffect(() => {
    if (scopeTab !== "SKU" || skuQuery.length < 2) {
      setSkuResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSkuSearching(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(skuQuery)}`);
        if (res.ok) {
          const json = await res.json();
          setSkuResults(json.data);
        }
      } catch {
        /* ignore */
      } finally {
        setSkuSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [skuQuery, scopeTab]);

  // Available sub-categories based on selected category in SUB_CATEGORY mode
  const availableSubCategories = useMemo(() => {
    if (scopeTab !== "SUB_CATEGORY") return [];
    // Aggregate all sub-categories across all categories
    const allSubs: string[] = [];
    Object.values(SUB_CATEGORIES).forEach((subs) => {
      subs.forEach((s) => {
        if (!allSubs.includes(s)) allSubs.push(s);
      });
    });
    // Exclude already-added ones
    const existingValues = new Set(
      rules.filter((r) => r.scopeType === "SUB_CATEGORY").map((r) => r.scopeValue)
    );
    return allSubs.filter((s) => !existingValues.has(s));
  }, [scopeTab, rules]);

  // Available categories (exclude already added)
  const availableCategories = useMemo(() => {
    const existing = new Set(
      rules.filter((r) => r.scopeType === "CATEGORY").map((r) => r.scopeValue)
    );
    return PRODUCT_CATEGORIES.filter((c) => !existing.has(c));
  }, [rules]);

  return (
    <div className={cn("rounded-xl border overflow-hidden", accentClass)}>
      {/* Header */}
      <div className={cn("px-4 py-3 flex items-center gap-2", headerClass)}>
        <Icon className="h-4 w-4" />
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-[10px] opacity-80">{subtitle}</p>
        </div>
      </div>

      <div className="p-4 space-y-3 bg-card">
        {/* Rule chips */}
        {rules.length === 0 && !showAddForm && (
          <p className="text-xs text-muted-foreground text-center py-3">
            No rules configured. Add one below.
          </p>
        )}

        {rules.length > 0 && (
          <div className="space-y-1.5">
            {rules.map((rule) => (
              <RuleChip
                key={rule.id}
                rule={rule}
                onRemove={() => onRemoveRule(rule.id)}
                onUpdateDiscount={(d) => onUpdateDiscount(rule.id, d)}
              />
            ))}
          </div>
        )}

        {/* Priority note */}
        {rules.length > 1 && (
          <p className="text-[10px] text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
            Priority: SKU rules override Sub-Category, which override Category rules.
          </p>
        )}

        {/* Add rule form */}
        {showAddForm ? (
          <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
            {/* Scope tabs */}
            <div className="flex gap-1 p-0.5 rounded-lg bg-muted/50">
              {(["CATEGORY", "SUB_CATEGORY", "SKU"] as const).map((tab) => {
                const TabIcon = SCOPE_ICONS[tab];
                return (
                  <button
                    key={tab}
                    onClick={() => setScopeTab(tab)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors",
                      scopeTab === tab
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <TabIcon className="h-3 w-3" />
                    {SCOPE_LABELS[tab]}
                  </button>
                );
              })}
            </div>

            {/* Discount input */}
            <div className="flex items-center gap-2">
              <Label className="text-[10px] text-muted-foreground shrink-0">Discount</Label>
              <div className="relative w-20">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="h-7 text-sm pr-6"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  %
                </span>
              </div>
            </div>

            {/* Category picker */}
            {scopeTab === "CATEGORY" && (
              <div className="space-y-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                >
                  <option value="">Select a category...</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!selectedCategory}
                  onClick={handleAddCategory}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Category Rule
                </Button>
              </div>
            )}

            {/* Sub-Category picker */}
            {scopeTab === "SUB_CATEGORY" && (
              <div className="space-y-2">
                <select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                >
                  <option value="">Select a sub-category...</option>
                  {availableSubCategories.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!selectedSubCategory}
                  onClick={handleAddSubCategory}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Sub-Category Rule
                </Button>
              </div>
            )}

            {/* SKU search */}
            {scopeTab === "SKU" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={skuQuery}
                    onChange={(e) => setSkuQuery(e.target.value)}
                    placeholder="Search by product name or SKU..."
                    className="h-8 pl-8 text-sm"
                  />
                  {skuSearching && (
                    <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                </div>
                {skuResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-lg border divide-y">
                    {skuResults.map((product) => {
                      const alreadyAdded = rules.some(
                        (r) => r.scopeType === "SKU" && r.scopeValue === product.sku
                      );
                      return (
                        <button
                          key={product.id}
                          disabled={alreadyAdded}
                          onClick={() => handleAddSku(product)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-muted/50 transition-colors",
                            alreadyAdded && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-muted-foreground">
                              SKU {product.sku} · {product.category}
                              {product.subCategory ? ` · ${product.subCategory}` : ""}
                            </p>
                          </div>
                          <span className="text-muted-foreground shrink-0 ml-2">
                            {formatCurrency(product.retailPrice)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {skuQuery.length >= 2 && !skuSearching && skuResults.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No products found
                  </p>
                )}
              </div>
            )}

            <button
              onClick={resetForm}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Rule
          </Button>
        )}

        {/* Preview table */}
        <EffectivePreview tierId={tierId} rules={rules} type={type} />
      </div>
    </div>
  );
}

// ─── Rule Chip ───────────────────────────────────────────────
function RuleChip({
  rule,
  onRemove,
  onUpdateDiscount,
}: {
  rule: RedemptionRule;
  onRemove: () => void;
  onUpdateDiscount: (d: number) => void;
}) {
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountVal, setDiscountVal] = useState(String(rule.discountPercent));

  const scopeLabel =
    rule.scopeType === "CATEGORY"
      ? rule.scopeValue
      : rule.scopeType === "SUB_CATEGORY"
        ? rule.scopeValue
        : `SKU ${rule.scopeValue}`;

  const scopeBadgeColor =
    rule.scopeType === "SKU"
      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
      : rule.scopeType === "SUB_CATEGORY"
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  function handleDiscountBlur() {
    const val = parseInt(discountVal);
    if (!isNaN(val) && val >= 0 && val <= 100 && val !== rule.discountPercent) {
      onUpdateDiscount(val);
    } else {
      setDiscountVal(String(rule.discountPercent));
    }
    setEditingDiscount(false);
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 group">
      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", scopeBadgeColor)}>
        {rule.scopeType === "CATEGORY"
          ? "Cat"
          : rule.scopeType === "SUB_CATEGORY"
            ? "Sub"
            : "SKU"}
      </span>
      <span className="text-xs font-medium flex-1 truncate">{scopeLabel}</span>
      {editingDiscount ? (
        <div className="relative w-14 shrink-0">
          <Input
            type="number"
            min={0}
            max={100}
            value={discountVal}
            onChange={(e) => setDiscountVal(e.target.value)}
            onBlur={handleDiscountBlur}
            onKeyDown={(e) => e.key === "Enter" && handleDiscountBlur()}
            className="h-6 text-[11px] pr-4 text-right"
            autoFocus
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
            %
          </span>
        </div>
      ) : (
        <button
          onClick={() => setEditingDiscount(true)}
          className="text-xs font-semibold tabular-nums text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {rule.discountPercent}%
        </button>
      )}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Effective Preview ───────────────────────────────────────
/* eslint-disable @typescript-eslint/no-unused-vars */
function EffectivePreview({
  tierId,
  rules,
  type,
}: {
  tierId: string;
  rules: RedemptionRule[];
  type: string;
}) {
/* eslint-enable @typescript-eslint/no-unused-vars */
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch products that match any of the rules
  useEffect(() => {
    if (rules.length === 0) {
      setProducts([]);
      return;
    }

    let cancelled = false;
    async function fetchPreview() {
      setLoading(true);
      try {
        // Fetch all products for preview (limit to 50 for perf)
        const res = await fetch(`/api/products/search?q=`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          setProducts(json.data);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPreview();
    return () => {
      cancelled = true;
    };
  }, [rules, tierId]);

  // Compute effective discounts with priority resolution
  const previewProducts = useMemo(() => {
    if (rules.length === 0 || products.length === 0) return [];

    const results: PreviewProduct[] = [];

    for (const product of products) {
      // Find matching rules (SKU > SUB_CATEGORY > CATEGORY)
      const skuRule = rules.find(
        (r) => r.scopeType === "SKU" && r.scopeValue === product.sku
      );
      const subCatRule = rules.find(
        (r) =>
          r.scopeType === "SUB_CATEGORY" &&
          product.subCategory &&
          r.scopeValue === product.subCategory
      );
      const catRule = rules.find(
        (r) => r.scopeType === "CATEGORY" && r.scopeValue === product.category
      );

      const matchedRule = skuRule || subCatRule || catRule;
      if (!matchedRule) continue;

      const discountApplied = matchedRule.discountPercent;
      const effectivePrice =
        product.retailPrice * (1 - discountApplied / 100);

      results.push({
        ...product,
        discountApplied,
        effectivePrice,
        matchedRule,
      });
    }

    return results.slice(0, 10);
  }, [rules, products]);

  if (rules.length === 0) return null;

  return (
    <div className="border-t pt-3 mt-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Price Preview
      </p>
      {loading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : previewProducts.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          No matching products found
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b">
                <th className="text-left py-1.5 pr-2 font-medium">Product</th>
                <th className="text-right py-1.5 px-2 font-medium">Retail</th>
                <th className="text-right py-1.5 px-2 font-medium">Discount</th>
                <th className="text-right py-1.5 pl-2 font-medium">Member Price</th>
              </tr>
            </thead>
            <tbody>
              {previewProducts.map((p) => (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="py-1.5 pr-2">
                    <p className="font-medium truncate max-w-[140px]">{p.name}</p>
                    <p className="text-muted-foreground text-[10px]">
                      via {p.matchedRule.scopeType === "SKU" ? "SKU" : p.matchedRule.scopeType === "SUB_CATEGORY" ? "Sub-Cat" : "Cat"}
                    </p>
                  </td>
                  <td className="text-right py-1.5 px-2 tabular-nums text-muted-foreground">
                    {formatCurrency(p.retailPrice)}
                  </td>
                  <td className="text-right py-1.5 px-2 tabular-nums font-semibold">
                    {p.discountApplied}%
                  </td>
                  <td className="text-right py-1.5 pl-2 tabular-nums font-semibold">
                    {formatCurrency(p.effectivePrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

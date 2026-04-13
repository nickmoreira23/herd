"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  ShoppingBag,
  Percent,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

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

type ScopeTab = "CATEGORY" | "SUB_CATEGORY" | "SKU";

// ─── Main Component ──────────────────────────────────────────
interface ProductsTabProps {
  tierId: string;
  onBenefitSaved?: () => void;
}

export function ProductsTab({ tierId, onBenefitSaved }: ProductsTabProps) {
  const [rules, setRules] = useState<RedemptionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [dbSubCategories, setDbSubCategories] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch("/api/products/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setDbCategories(json.data.categories);
          setDbSubCategories(json.data.subCategories);
        }
      })
      .catch(() => {});
  }, []);

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
      toast.success("Rule added");
      onBenefitSaved?.();
      await fetchRules();
    } catch {
      toast.error("Failed to add rule");
    }
  }

  async function removeRule(ruleId: string) {
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
      toast.success("Rule removed");
      onBenefitSaved?.();
    } catch {
      toast.error("Failed to remove rule");
      await fetchRules();
    }
  }

  async function updateDiscount(ruleId: string, discountPercent: number) {
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
      toast.success("Discount updated");
      onBenefitSaved?.();
    } catch {
      toast.error("Failed to update discount");
      await fetchRules();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalRules = rules.length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header with explanation */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            Product Discount Rules
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-lg">
            Set which products this tier&apos;s members can purchase at a discount.
            Rules can target entire categories, sub-categories, or specific products by SKU.
          </p>
        </div>
        {totalRules > 0 && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            {totalRules} rule{totalRules !== 1 ? "s" : ""} active
          </Badge>
        )}
      </div>

      {/* How it works — collapsible */}
      <HowItWorks />

      {/* Discount type sections */}
      <div className="space-y-4">
        <DiscountSection
          title="Members Store"
          description="Members use their monthly credits to buy products at a discounted price. Credits are deducted from their balance."
          type="MEMBERS_STORE"
          icon={Store}
          accentColor="#000000"
          headerClass="bg-black text-white"
          borderClass="border-black/30"
          rules={storeRules}
          allRules={rules}
          defaultDiscount={40}
          onAddRule={(discount, scopeType, scopeValue) =>
            addRule("MEMBERS_STORE", discount, scopeType, scopeValue)
          }
          onRemoveRule={removeRule}
          onUpdateDiscount={updateDiscount}
          dbCategories={dbCategories}
          dbSubCategories={dbSubCategories}
        />

        <DiscountSection
          title="Members Rate"
          description="Members get a flat percentage discount on retail price. They pay out-of-pocket at the reduced rate — no credits used."
          type="MEMBERS_RATE"
          icon={CreditCard}
          accentColor="#EF4444"
          headerClass="bg-red-500 text-white"
          borderClass="border-red-500/30"
          rules={rateRules}
          allRules={rules}
          defaultDiscount={20}
          onAddRule={(discount, scopeType, scopeValue) =>
            addRule("MEMBERS_RATE", discount, scopeType, scopeValue)
          }
          onRemoveRule={removeRule}
          onUpdateDiscount={updateDiscount}
          dbCategories={dbCategories}
          dbSubCategories={dbSubCategories}
        />
      </div>
    </div>
  );
}

// ─── How it works ────────────────────────────────────────────

function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border bg-muted/20">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          How discount rules work
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-3 border-t pt-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-black" />
                <span className="text-xs font-semibold">Members Store</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Products purchased using monthly subscription credits.
                Set a % discount off retail — the discounted price is what gets deducted from the member&apos;s credit balance.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs font-semibold">Members Rate</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                A flat membership discount on retail price, paid out-of-pocket (no credits used).
                Great for items outside the store credit system.
              </p>
            </div>
          </div>
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">
              <strong className="text-foreground">Priority order:</strong> If a product matches multiple rules,
              the most specific one wins — SKU beats Sub-Category, which beats Category.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Discount Section ───────────────────────────────────────

interface DiscountSectionProps {
  title: string;
  description: string;
  type: string;
  icon: React.ElementType;
  accentColor: string;
  headerClass: string;
  borderClass: string;
  rules: RedemptionRule[];
  allRules: RedemptionRule[];
  defaultDiscount: number;
  onAddRule: (discount: number, scopeType: string, scopeValue: string) => void;
  onRemoveRule: (ruleId: string) => void;
  onUpdateDiscount: (ruleId: string, discount: number) => void;
  dbCategories: string[];
  dbSubCategories: Record<string, string[]>;
}

function DiscountSection({
  title,
  description,
  type,
  icon: Icon,
  accentColor,
  headerClass,
  borderClass,
  rules,
  defaultDiscount,
  onAddRule,
  onRemoveRule,
  onUpdateDiscount,
  dbCategories,
  dbSubCategories,
}: DiscountSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [scopeTab, setScopeTab] = useState<ScopeTab>("CATEGORY");
  const [discount, setDiscount] = useState(String(defaultDiscount));
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [skuQuery, setSkuQuery] = useState("");
  const [skuResults, setSkuResults] = useState<SearchProduct[]>([]);
  const [skuSearching, setSkuSearching] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
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

  const availableSubCategories = useMemo(() => {
    if (scopeTab !== "SUB_CATEGORY") return [];
    const subs = filterCategory
      ? dbSubCategories[filterCategory] || []
      : Object.values(dbSubCategories).flat();
    const unique = Array.from(new Set(subs));
    const existingValues = new Set(
      rules.filter((r) => r.scopeType === "SUB_CATEGORY").map((r) => r.scopeValue)
    );
    return unique.filter((s) => !existingValues.has(s));
  }, [scopeTab, rules, filterCategory, dbSubCategories]);

  const availableCategories = useMemo(() => {
    const existing = new Set(
      rules.filter((r) => r.scopeType === "CATEGORY").map((r) => r.scopeValue)
    );
    return dbCategories.filter((c) => !existing.has(c));
  }, [rules, dbCategories]);

  // Group rules by scope for cleaner display
  const categoryRules = rules.filter((r) => r.scopeType === "CATEGORY");
  const subCategoryRules = rules.filter((r) => r.scopeType === "SUB_CATEGORY");
  const skuRules = rules.filter((r) => r.scopeType === "SKU");

  return (
    <div className={cn("rounded-xl border overflow-hidden", borderClass)}>
      {/* Header */}
      <div className={cn("px-4 py-3 flex items-center justify-between", headerClass)}>
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4" />
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-[11px] opacity-80">{description}</p>
          </div>
        </div>
        {rules.length > 0 && (
          <Badge
            className="text-[10px] px-1.5 py-0 bg-white/20 text-white border-white/30"
          >
            {rules.length} rule{rules.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="bg-card">
        {/* Empty state with guidance */}
        {rules.length === 0 && !showAddForm && (
          <div className="px-6 py-8 text-center">
            <div
              className="mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <Percent className="h-4.5 w-4.5" style={{ color: accentColor }} />
            </div>
            <p className="text-sm font-medium mb-1">No discount rules yet</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
              Add rules to define which products are available at a discount for this tier&apos;s members.
            </p>
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="bg-black text-white hover:bg-black/90"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add First Rule
            </Button>
          </div>
        )}

        {/* Active rules grouped by scope */}
        {rules.length > 0 && (
          <div className="p-4 space-y-3">
            {/* Category rules */}
            {categoryRules.length > 0 && (
              <RuleGroup
                label="By Category"
                icon={Tag}
                rules={categoryRules}
                onRemove={onRemoveRule}
                onUpdateDiscount={onUpdateDiscount}
                accentColor={accentColor}
              />
            )}

            {/* Sub-Category rules */}
            {subCategoryRules.length > 0 && (
              <RuleGroup
                label="By Sub-Category"
                icon={FolderTree}
                rules={subCategoryRules}
                onRemove={onRemoveRule}
                onUpdateDiscount={onUpdateDiscount}
                accentColor={accentColor}
              />
            )}

            {/* SKU rules */}
            {skuRules.length > 0 && (
              <RuleGroup
                label="By Product (SKU)"
                icon={Package}
                rules={skuRules}
                onRemove={onRemoveRule}
                onUpdateDiscount={onUpdateDiscount}
                accentColor={accentColor}
              />
            )}

            {/* Priority note */}
            {rules.length > 1 &&
              (categoryRules.length > 0 || subCategoryRules.length > 0) &&
              skuRules.length > 0 && (
                <p className="text-[10px] text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
                  SKU-specific rules take priority over sub-category and category-level rules.
                </p>
              )}

            {/* Add another rule button */}
            {!showAddForm && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-1"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Add Rule
              </Button>
            )}
          </div>
        )}

        {/* Add rule form */}
        {showAddForm && (
          <div className="p-4">
            <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Add Discount Rule</p>
                <button
                  onClick={resetForm}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Step 1: Choose scope */}
              <div className="space-y-2">
                <Label className="text-[11px] text-muted-foreground font-medium">
                  1. What should this rule apply to?
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["CATEGORY", "SUB_CATEGORY", "SKU"] as const).map((tab) => {
                    const TabIcon =
                      tab === "CATEGORY" ? Tag : tab === "SUB_CATEGORY" ? FolderTree : Package;
                    const label =
                      tab === "CATEGORY"
                        ? "Entire Category"
                        : tab === "SUB_CATEGORY"
                          ? "Sub-Category"
                          : "Specific Product";
                    const desc =
                      tab === "CATEGORY"
                        ? "All products in a category"
                        : tab === "SUB_CATEGORY"
                          ? "A product sub-group"
                          : "One product by SKU";

                    return (
                      <button
                        key={tab}
                        onClick={() => setScopeTab(tab)}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-all",
                          scopeTab === tab
                            ? "border-foreground/30 bg-muted/50 ring-1 ring-foreground/10"
                            : "border-border hover:border-foreground/20 hover:bg-muted/30"
                        )}
                      >
                        <TabIcon className="h-4 w-4 text-muted-foreground mb-1.5" />
                        <p className="text-xs font-medium">{label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select target */}
              <div className="space-y-2">
                <Label className="text-[11px] text-muted-foreground font-medium">
                  2. Select {scopeTab === "CATEGORY" ? "a category" : scopeTab === "SUB_CATEGORY" ? "a sub-category" : "a product"}
                </Label>

                {/* Category picker */}
                {scopeTab === "CATEGORY" && (
                  <div className="space-y-2">
                    {availableCategories.length === 0 ? (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                        All categories already have rules. Remove one to add a different category.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {availableCategories.map((c) => (
                          <button
                            key={c}
                            onClick={() => setSelectedCategory(c)}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-xs font-medium transition-all text-left",
                              selectedCategory === c
                                ? "border-foreground/30 bg-muted/50"
                                : "border-border hover:border-foreground/20"
                            )}
                          >
                            {c.charAt(0) + c.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-Category picker */}
                {scopeTab === "SUB_CATEGORY" && (
                  <div className="space-y-2">
                    {/* Category filter */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setFilterCategory("")}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-all",
                          !filterCategory
                            ? "border-foreground/30 bg-muted/50 font-medium"
                            : "border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        All
                      </button>
                      {dbCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setFilterCategory(cat)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs transition-all",
                            filterCategory === cat
                              ? "border-foreground/30 bg-muted/50 font-medium"
                              : "border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                    {availableSubCategories.length === 0 ? (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                        {filterCategory ? "No sub-categories available for this category." : "All sub-categories already have rules."}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {availableSubCategories.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSelectedSubCategory(s)}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs transition-all",
                              selectedSubCategory === s
                                ? "border-foreground/30 bg-muted/50 font-medium"
                                : "border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SKU search */}
                {scopeTab === "SKU" && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={skuQuery}
                        onChange={(e) => setSkuQuery(e.target.value)}
                        placeholder="Type a product name or SKU to search..."
                        className="pl-9"
                        autoFocus
                      />
                      {skuSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {skuResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
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
                                "w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/50 transition-colors",
                                alreadyAdded && "opacity-40 cursor-not-allowed"
                              )}
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">{product.name}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {product.sku} &middot; {product.category}
                                  {product.subCategory ? ` &middot; ${product.subCategory}` : ""}
                                </p>
                              </div>
                              <div className="text-right shrink-0 ml-3">
                                <p className="text-xs tabular-nums">{formatCurrency(product.retailPrice)}</p>
                                <p className="text-[10px] text-muted-foreground tabular-nums">
                                  {discount}% off = {formatCurrency(product.retailPrice * (1 - (parseInt(discount) || 0) / 100))}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {skuQuery.length >= 2 && !skuSearching && skuResults.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        No products found for &ldquo;{skuQuery}&rdquo;
                      </p>
                    )}
                    {skuQuery.length < 2 && (
                      <p className="text-[11px] text-muted-foreground text-center py-2">
                        Type at least 2 characters to search
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Set discount + Add button */}
              {scopeTab !== "SKU" && (
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground font-medium">
                    3. Set the discount percentage
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-24">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="pr-7 text-sm"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">off retail price</span>
                  </div>

                  {scopeTab === "CATEGORY" && availableCategories.length > 0 && (
                    <Button
                      size="sm"
                      className="w-full bg-black text-white hover:bg-black/90"
                      disabled={!selectedCategory}
                      onClick={handleAddCategory}
                    >
                      <Plus className="h-3 w-3 mr-1.5" />
                      Add {selectedCategory ? selectedCategory.charAt(0) + selectedCategory.slice(1).toLowerCase() : "Category"} at {discount}% off
                    </Button>
                  )}

                  {scopeTab === "SUB_CATEGORY" && availableSubCategories.length > 0 && (
                    <Button
                      size="sm"
                      className="w-full bg-black text-white hover:bg-black/90"
                      disabled={!selectedSubCategory}
                      onClick={handleAddSubCategory}
                    >
                      <Plus className="h-3 w-3 mr-1.5" />
                      Add {selectedSubCategory || "Sub-Category"} at {discount}% off
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Rule Group ────────────────────────────────────────────

function RuleGroup({
  label,
  icon: Icon,
  rules,
  onRemove,
  onUpdateDiscount,
  accentColor,
}: {
  label: string;
  icon: React.ElementType;
  rules: RedemptionRule[];
  onRemove: (id: string) => void;
  onUpdateDiscount: (id: string, d: number) => void;
  accentColor: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="space-y-1">
        {rules.map((rule) => (
          <RuleChip
            key={rule.id}
            rule={rule}
            onRemove={() => onRemove(rule.id)}
            onUpdateDiscount={(d) => onUpdateDiscount(rule.id, d)}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Rule Chip ──────────────────────────────────────────────

function RuleChip({
  rule,
  onRemove,
  onUpdateDiscount,
  accentColor,
}: {
  rule: RedemptionRule;
  onRemove: () => void;
  onUpdateDiscount: (d: number) => void;
  accentColor: string;
}) {
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountVal, setDiscountVal] = useState(String(rule.discountPercent));

  const scopeLabel =
    rule.scopeType === "CATEGORY"
      ? rule.scopeValue.charAt(0) + rule.scopeValue.slice(1).toLowerCase()
      : rule.scopeType === "SUB_CATEGORY"
        ? rule.scopeValue
        : `SKU: ${rule.scopeValue}`;

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
    <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 group hover:bg-muted/20 transition-colors">
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: accentColor }}
      />
      <span className="text-xs font-medium flex-1 truncate">{scopeLabel}</span>
      {editingDiscount ? (
        <div className="relative w-16 shrink-0">
          <Input
            type="number"
            min={0}
            max={100}
            value={discountVal}
            onChange={(e) => setDiscountVal(e.target.value)}
            onBlur={handleDiscountBlur}
            onKeyDown={(e) => e.key === "Enter" && handleDiscountBlur()}
            className="h-6 text-[11px] pr-5 text-right"
            autoFocus
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
            %
          </span>
        </div>
      ) : (
        <button
          onClick={() => setEditingDiscount(true)}
          className="text-xs font-semibold tabular-nums hover:text-foreground transition-colors shrink-0 rounded px-1.5 py-0.5 hover:bg-muted"
          style={{ color: accentColor }}
          title="Click to edit discount"
        >
          {rule.discountPercent}% off
        </button>
      )}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all shrink-0"
        title="Remove rule"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}


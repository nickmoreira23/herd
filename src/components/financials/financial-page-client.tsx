"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFinancialStore } from "@/stores/financial-store";
import { useUIStore } from "@/stores/ui-store";
import type {
  TierFinancialInput,
  PartnerKickbackInput,
  CommissionCalcInput,
  SalesRepChannel,
  SamplerChannel,
  FinancialInputs,
  OperationalOverhead,
} from "@/lib/financial-engine";
import type { OpexCategoryData } from "@/lib/opex-resolver";
import type { DataSourceMeta, TierDisplayMeta, PackageCatalogEntry } from "@/app/admin/financials/data";
import { ScenarioBuilder } from "./scenario-builder";
import { ExecutiveSummary } from "./executive-summary";
import { MetricsPanel } from "./metrics-panel";
import { FinancialCharts } from "./financial-charts";
import { PLStatement } from "./pl-statement";
import { ProjectionSpreadsheet } from "./projection-spreadsheet";
import { CohortSpreadsheet } from "./cohort-spreadsheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Save,
  Check,
  Sparkles,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Maximize2,
  Minimize2,
  PanelLeftOpen,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import Link from "next/link";

export type TimePeriod = "month" | "quarter" | "semester" | "year" | "custom";

export const TIME_PERIOD_CONFIG: Record<
  TimePeriod,
  { multiplier: number; months: number }
> = {
  month: { multiplier: 1, months: 1 },
  quarter: { multiplier: 3, months: 3 },
  semester: { multiplier: 6, months: 6 },
  year: { multiplier: 12, months: 12 },
  custom: { multiplier: 1, months: 1 }, // placeholder, overridden by customMonths
};

export function getTimePeriodMultiplier(
  timePeriod: TimePeriod,
  customMonths: number
): number {
  if (timePeriod === "custom") return customMonths;
  return TIME_PERIOD_CONFIG[timePeriod].multiplier;
}

/**
 * Returns the localized label for a time period selector.
 * For custom periods, formats as "{N}-Month" via the parameterized
 * `financials.toolbar.time_period.custom_months` key.
 */
export function getTimePeriodLabel(
  timePeriod: TimePeriod,
  customMonths: number,
  t: (key: MessageKey, params?: Record<string, string | number>) => string,
): string {
  if (timePeriod === "custom") {
    return t("financials.toolbar.time_period.custom_months", { months: customMonths });
  }
  return t(`financials.toolbar.time_period.${timePeriod}` as MessageKey);
}

const MODEL_COLORS = [
  { name: "Green", value: "#22C55E" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Orange", value: "#F97316" },
  { name: "Red", value: "#EF4444" },
  { name: "Purple", value: "#A855F7" },
  { name: "Gray", value: "#6B7280" },
];

const MODEL_COLOR_NAME_KEYS: Record<string, MessageKey> = {
  Green: "financials.toolbar.color.green",
  Blue: "financials.toolbar.color.blue",
  Yellow: "financials.toolbar.color.yellow",
  Orange: "financials.toolbar.color.orange",
  Red: "financials.toolbar.color.red",
  Purple: "financials.toolbar.color.purple",
  Gray: "financials.toolbar.color.gray",
};

interface FinancialPageClientProps {
  tierData: TierFinancialInput[];
  commissionData: CommissionCalcInput;
  salesRepData: SalesRepChannel;
  samplerData?: SamplerChannel;
  partnerData: PartnerKickbackInput[];
  overheadData: OperationalOverhead;
  opexData: OpexCategoryData[];
  modelId?: string;
  initialName?: string;
  initialColor?: string;
  initialInputs?: FinancialInputs;
  // New: product-derived COGS defaults
  productCOGSRatio?: number;
  productFulfillmentCost?: number;
  productShippingCost?: number;
  // New: data source metadata for UI indicators
  dataSourceMeta?: DataSourceMeta;
  // New: tier display metadata for read-only plan structure display
  tierDisplayMeta?: TierDisplayMeta[];
  // Reference packages catalog (for COGS-from-package selector in Plans card).
  packagesCatalog?: PackageCatalogEntry[];
  // 1.5.6a-bis: required for locale-aware formatting in children
  locale: Locale;
}

export function FinancialPageClient({
  tierData,
  commissionData,
  salesRepData,
  samplerData,
  partnerData,
  overheadData,
  opexData,
  modelId,
  initialName = "",
  initialColor = "#3B82F6",
  initialInputs,
  productCOGSRatio,
  productFulfillmentCost,
  productShippingCost,
  dataSourceMeta,
  tierDisplayMeta,
  packagesCatalog,
  locale,
}: FinancialPageClientProps) {
  const router = useRouter();
  const t = useT();
  const { setInputs, inputs, results, loadInputs } = useFinancialStore();
  const initialized = useRef<boolean | null>(null);
  const [modelName, setModelName] = useState(initialName);
  const [modelColor, setModelColor] = useState(initialColor);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editing, setEditing] = useState(!modelId);

  // Time period for projection
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  // Track the active projection tab so we can hide controls that don't
  // apply to certain views — e.g. the time-period selector is meaningless
  // on the Summary tab (which shows a single point-in-time snapshot)
  // and on the Cohort tab (which has its own per-month / per-cohort
  // axis). Showing it there made it look like changing the period
  // affected those views, when it didn't.
  const [activeProjectionTab, setActiveProjectionTab] = useState("summary");
  // Perspective filter (S4) — "general" (all parties) | partyId. Ephemeral,
  // page-level (like the tab/period); never persisted to FinancialInputs.
  const [perspective, setPerspective] = useState<string>("general");
  const [customMonths, setCustomMonths] = useState(6);

  // Remix modal state
  const [remixOpen, setRemixOpen] = useState(false);
  const [remixPrompt, setRemixPrompt] = useState("");
  const [remixing, setRemixing] = useState(false);

  // Duplicate modal state
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicateColor, setDuplicateColor] = useState("#3B82F6");
  const [duplicating, setDuplicating] = useState(false);

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Full-screen projection view
  const [fullScreen, setFullScreen] = useState(false);

  // Seed the financial store on first mount. Doing this in useEffect (not
  // synchronously during render) prevents the React warning "Cannot update
  // a component while rendering a different component" — Zustand's `set()`
  // would otherwise notify every subscriber (including sibling panels) in
  // the middle of FinancialPageClient's render. The `initialized` ref
  // guards against re-running on re-mounts (e.g. fast refresh).
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (initialInputs) {
      // For existing models, inject current OPEX data if the model uses milestone-scaled mode.
      const migratedInputs = { ...initialInputs };
      if (migratedInputs.operationalOverhead?.mode === "milestone-scaled" && opexData.length > 0) {
        migratedInputs.operationalOverhead = { ...migratedInputs.operationalOverhead, opexData };
      }
      // Refresh per-tier PLAN STRUCTURE from the current SubscriptionTier
      // table — pricing, credits, per-tier shipping/handling/processing
      // are immutable inputs (controlled by the plan admin, not the
      // projection editor). Saved snapshots from before any of these
      // fields existed (or saved when the engine had a different
      // `biannualPrice` interpretation) would otherwise display stale
      // values that disagree with the live plan detail page. The
      // EDITABLE projection fields (subscriberPercent, churnRateMonthly,
      // billingDistribution overrides, addOns, packageCOGSPerSub) are
      // preserved from the snapshot.
      const tierByName = new Map(tierData.map((t) => [t.tierId, t]));
      migratedInputs.tiers = migratedInputs.tiers.map((saved) => {
        const current = tierByName.get(saved.tierId);
        if (!current) return saved;
        return {
          ...saved,
          // Pull immutable plan-structure fields from current DB.
          monthlyPrice: current.monthlyPrice,
          biannualPricePerMonth: current.biannualPricePerMonth,
          annualPricePerMonth: current.annualPricePerMonth,
          monthlyCredits: current.monthlyCredits,
          apparelCOGSPerMonth: current.apparelCOGSPerMonth,
          avgShippingCost: current.avgShippingCost,
          avgHandlingCost: current.avgHandlingCost,
          processingFeePct: current.processingFeePct,
          processingFeeFlat: current.processingFeeFlat,
        };
      });
      loadInputs(migratedInputs, initialName);
    } else {
      // New model: initialize with all available structured data.
      setInputs({
        tiers: tierData,
        commissionStructure: commissionData,
        salesRepChannel: salesRepData,
        ...(samplerData != null && { samplerChannel: samplerData }),
        partnerKickbacks: partnerData,
        operationalOverhead: overheadData,
        // Apply product-derived COGS if available
        ...(productCOGSRatio != null && { avgCOGSToMemberPriceRatio: productCOGSRatio }),
        ...(productFulfillmentCost != null && { fulfillmentCostPerOrder: productFulfillmentCost }),
        ...(productShippingCost != null && { shippingCostPerOrder: productShippingCost }),
      });
    }
    // Intentionally only on mount — props above are server-rendered initial
    // values; we don't want to reseed if the parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = useCallback(async () => {
    if (!modelName.trim()) {
      notifyError("financials.toolbar.error.enter_model_name", t);
      return;
    }
    if (!results) {
      notifyError("financials.toolbar.error.no_results_to_save", t);
      return;
    }
    setSaving(true);
    try {
      const url = modelId ? `/api/financials/${modelId}` : "/api/financials";
      const method = modelId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioName: modelName.trim(),
          color: modelColor,
          assumptions: inputs,
          results,
        }),
      });
      if (!res.ok) {
        notifyError("financials.toolbar.error.save_failed", t);
        return;
      }
      const json = await res.json();
      notifySuccess(
        modelId
          ? "common.feedback.updated_successfully"
          : "common.feedback.saved_successfully",
        t,
      );
      if (modelId) {
        // Existing model — stay on detail view, exit edit mode
        setEditing(false);
      } else {
        // New model — redirect to the newly created model's detail view
        const newId = json.data?.id;
        if (newId) {
          router.push(`/admin/operation/finances/projections/${newId}`);
        } else {
          router.push("/admin/operation/finances/projections");
        }
      }
    } catch {
      notifyError("financials.toolbar.error.save_failed_connection", t);
    } finally {
      setSaving(false);
    }
  }, [modelName, modelColor, inputs, results, modelId, router, t]);

  // Export the live scenario (including unsaved edits) to a multi-tab XLSX:
  // Projection, Cohort Aggregate, and one tab per acquisition cohort.
  // `exceljs` is dynamically imported so it stays out of the initial bundle.
  const handleExport = useCallback(async () => {
    if (!results) {
      notifyError("financials.toolbar.error.no_results_to_save", t);
      return;
    }
    setExporting(true);
    try {
      const { exportProjectionsToXlsx } = await import("./export");
      await exportProjectionsToXlsx(results, inputs, t, { scenarioName: modelName });
      notifySuccess("financials.export.success", t);
    } catch {
      notifyError("financials.export.error", t);
    } finally {
      setExporting(false);
    }
  }, [results, inputs, modelName, t]);

  const handleRemix = useCallback(async () => {
    if (!remixPrompt.trim()) {
      notifyError("financials.toolbar.error.describe_changes", t);
      return;
    }
    setRemixing(true);
    try {
      const res = await fetch("/api/financials/remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentInputs: inputs,
          prompt: remixPrompt.trim(),
        }),
      });
      if (!res.ok) {
        notifyError("financials.toolbar.error.remix_failed", t);
        return;
      }
      const { inputs: newInputs } = await res.json();
      loadInputs(newInputs, modelName);
      setEditing(true);
      setRemixOpen(false);
      setRemixPrompt("");
      notifySuccess("financials.toolbar.feedback.remixed", t);
    } catch {
      notifyError("common.feedback.error_occurred", t);
    } finally {
      setRemixing(false);
    }
  }, [remixPrompt, inputs, loadInputs, modelName, t]);

  const handleDuplicate = useCallback(async () => {
    if (!duplicateName.trim()) {
      notifyError("financials.toolbar.error.enter_duplicate_name", t);
      return;
    }
    if (!results) {
      notifyError("financials.toolbar.error.no_results_to_duplicate", t);
      return;
    }
    setDuplicating(true);
    try {
      const res = await fetch("/api/financials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioName: duplicateName.trim(),
          color: duplicateColor,
          assumptions: inputs,
          results,
        }),
      });
      if (!res.ok) {
        notifyError("financials.toolbar.error.duplicate_failed", t);
        return;
      }
      const newSnapshot = await res.json();
      notifySuccess("financials.toolbar.feedback.duplicated", t);
      setDuplicateOpen(false);
      setDuplicateName("");
      router.push(`/admin/operation/finances/projections/${newSnapshot.data.id}`);
    } catch {
      notifyError("common.feedback.error_occurred", t);
    } finally {
      setDuplicating(false);
    }
  }, [duplicateName, duplicateColor, inputs, results, router, t]);

  const handleDelete = useCallback(async () => {
    if (!modelId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/financials/${modelId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        notifyError("financials.toolbar.error.delete_failed", t);
        return;
      }
      notifySuccess("common.feedback.deleted_successfully", t);
      setDeleteOpen(false);
      router.push("/admin/operation/finances/projections");
    } catch {
      notifyError("common.feedback.error_occurred", t);
    } finally {
      setDeleting(false);
    }
  }, [modelId, router, t]);

  const isNewModel = !modelId;
  const subPanelId = useUIStore((s) => s.subPanelId);
  const subPanelCollapsed = useUIStore((s) => s.subPanelCollapsed);
  const setSubPanelCollapsed = useUIStore((s) => s.setSubPanelCollapsed);
  const showExpandButton = !!subPanelId && subPanelCollapsed;

  const periodMultiplier = getTimePeriodMultiplier(timePeriod, customMonths);
  const periodLabel = getTimePeriodLabel(timePeriod, customMonths, t);

  return (
    <div className="flex flex-col h-[100vh] overflow-hidden">
      {/* Header — breadcrumb + buttons. Border-b spans the full width
          touching the sidebar (no horizontal padding on this row). */}
      <div className="flex items-center justify-between shrink-0 border-b py-4 px-4">
        {/* Left: expand-panel button (when sub-panel is collapsed) + breadcrumb */}
        <nav className="flex items-center gap-2 text-base">
          {showExpandButton && (
            <button
              type="button"
              onClick={() => setSubPanelCollapsed(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
              title="Expand panel"
            >
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            </button>
          )}
          <Link
            href="/admin/operation/finances/projections"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("financials.toolbar.breadcrumb_finances")}
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {editing ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                {MODEL_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={t(MODEL_COLOR_NAME_KEYS[c.name])}
                    onClick={() => setModelColor(c.value)}
                    className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                      modelColor === c.value
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: c.value }}
                  >
                    {modelColor === c.value && (
                      <Check className="h-2 w-2 text-white" />
                    )}
                  </button>
                ))}
              </div>
              <Input
                placeholder={t("financials.toolbar.model_name_placeholder")}
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="h-8 w-52 text-base font-medium border-dashed"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: modelColor }}
              />
              <span className="text-foreground font-medium">{modelName}</span>
            </div>
          )}
        </nav>

        {/* Right: action buttons */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={exporting || !results}
            title={t("financials.export.button")}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {exporting
              ? t("financials.export.exporting")
              : t("financials.export.button")}
          </Button>
          {editing ? (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving
                ? t("financials.toolbar.button.saving")
                : t("financials.toolbar.button.save_model")}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md border border-input bg-background h-8 w-8 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  {t("common.actions.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRemixOpen(true)}>
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  {t("financials.toolbar.button.remix")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setDuplicateName(`${modelName} (Copy)`);
                    setDuplicateColor(modelColor);
                    setDuplicateOpen(true);
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  {t("financials.toolbar.button.duplicate")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  {t("common.actions.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Main content: 400px assumptions / projection takes the rest.
          When fullScreen, the projection overlays the entire viewport
          (covering the admin sidebar/header) via `fixed inset-0 z-50`. */}
      <div className={cn(
        "gap-4 flex-1 min-h-0 p-4",
        fullScreen ? "flex" : "grid grid-cols-[400px_minmax(0,1fr)]"
      )}>
        {/* Left: Assumptions */}
        {!fullScreen && (
          <div className="rounded-xl border bg-card flex flex-col min-h-0">
            <div className="px-4 flex items-center shrink-0" style={{ height: 68 }}>
              <h2 className="text-sm font-semibold">
                {t("financials.toolbar.assumptions_title")}
              </h2>
            </div>
            <div className="border-t" />
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              <ScenarioBuilder
                readOnly={!editing}
                defaultOpen={editing || isNewModel}
                dataSourceMeta={dataSourceMeta}
                tierDisplayMeta={tierDisplayMeta}
                packagesCatalog={packagesCatalog}
                locale={locale}
              />
            </div>
          </div>
        )}

        {/* Right: Projection */}
        <Tabs
          value={activeProjectionTab}
          onValueChange={setActiveProjectionTab}
          className={cn(
            "flex flex-col min-h-0",
            fullScreen
              ? "fixed inset-0 z-50 bg-background p-4"
              : "flex-1",
          )}
        >
          <div className="rounded-xl border bg-card flex flex-col min-h-0 flex-1">
            {/* Header: when the projection panel is narrow, title + period +
                tabs scroll horizontally INSIDE the header so nothing falls
                off the screen. The minimize/maximize button is absolutely
                positioned on the right and always reachable, with a fade
                gradient masking content that scrolls under it. */}
            <div className="relative shrink-0 border-b" style={{ height: 68 }}>
              <div className="absolute inset-0 pl-4 pr-14 flex items-center gap-3 overflow-x-auto scrollbar-thin">
                <div className="flex items-center gap-3 shrink-0">
                  <h2 className="text-sm font-semibold">
                    {t("financials.toolbar.projection_title")}
                  </h2>
                  {/* Time period applies only to views that scale a
                      headline figure by period (Statement). Summary is a
                      point-in-time snapshot; Spreadsheet/Cohort/Metrics/
                      Charts have their own time axes. Hiding the selector
                      on those tabs prevents users from thinking it
                      controls something it doesn't. */}
                  {activeProjectionTab === "statement" && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={timePeriod}
                        onValueChange={(v) => setTimePeriod(v as TimePeriod)}
                      >
                        <SelectTrigger className="h-7 w-[110px] text-xs border-dashed capitalize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month" className="text-xs">
                            {t("financials.toolbar.time_period.month")}
                          </SelectItem>
                          <SelectItem value="quarter" className="text-xs">
                            {t("financials.toolbar.time_period.quarter")}
                          </SelectItem>
                          <SelectItem value="semester" className="text-xs">
                            {t("financials.toolbar.time_period.semester")}
                          </SelectItem>
                          <SelectItem value="year" className="text-xs">
                            {t("financials.toolbar.time_period.year")}
                          </SelectItem>
                          <SelectItem value="custom" className="text-xs">
                            {t("financials.toolbar.time_period.custom")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {timePeriod === "custom" && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={1}
                            max={60}
                            value={customMonths}
                            onChange={(e) =>
                              setCustomMonths(
                                Math.max(1, Math.min(60, parseInt(e.target.value) || 1))
                              )
                            }
                            className="h-7 w-14 text-xs text-center border-dashed"
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {t("financials.toolbar.time_period.month_short")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Perspective filter (S4) — applies to the accrual cascade
                      views (statement/spreadsheet/metrics). Ephemeral. */}
                  {["statement", "spreadsheet", "metrics"].includes(
                    activeProjectionTab,
                  ) &&
                    inputs.profitSplitParties.length > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {t("financials.toolbar.perspective.label")}
                        </span>
                        <Select value={perspective} onValueChange={setPerspective}>
                          <SelectTrigger className="h-7 w-[130px] text-xs border-dashed">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general" className="text-xs">
                              {t("financials.toolbar.perspective.general")}
                            </SelectItem>
                            {inputs.profitSplitParties.map((p) => (
                              <SelectItem key={p.id} value={p.id} className="text-xs">
                                {p.name ||
                                  t("financials.builder.profit_split.unnamed")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                </div>
                <TabsList className="h-8 shrink-0 ml-auto">
                  <TabsTrigger value="summary" className="text-xs px-3 h-6 shrink-0">
                    {t("financials.toolbar.tab.summary")}
                  </TabsTrigger>
                  <TabsTrigger value="statement" className="text-xs px-3 h-6 shrink-0">
                    {t("financials.toolbar.tab.statement")}
                  </TabsTrigger>
                  <TabsTrigger value="spreadsheet" className="text-xs px-3 h-6 shrink-0">
                    {t("financials.toolbar.tab.spreadsheet")}
                  </TabsTrigger>
                  <TabsTrigger value="cohort" className="text-xs px-3 h-6 shrink-0">
                    {t("financials.toolbar.tab.cohort")}
                  </TabsTrigger>
                  <TabsTrigger value="metrics" className="text-xs px-3 h-6 shrink-0">
                    {t("financials.toolbar.tab.metrics")}
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="text-xs px-3 h-6 shrink-0">
                    {t("financials.toolbar.tab.charts")}
                  </TabsTrigger>
                </TabsList>
              </div>
              {/* Fade gradient to hint there's more content scrolling under
                  the minimize button. */}
              <div
                aria-hidden
                className="pointer-events-none absolute right-12 top-0 bottom-0 w-6 bg-gradient-to-l from-card to-transparent"
              />
              {/* Minimize/maximize — anchored to the right, always reachable. */}
              <button
                type="button"
                onClick={() => setFullScreen(!fullScreen)}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors bg-card"
                title={
                  fullScreen
                    ? t("financials.toolbar.button.exit_full_screen")
                    : t("financials.toolbar.button.full_screen")
                }
              >
                {fullScreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              <TabsContent value="summary" className="mt-0">
                <ExecutiveSummary locale={locale} />
              </TabsContent>
              <TabsContent value="statement" className="mt-0">
                <PLStatement multiplier={periodMultiplier} periodLabel={periodLabel} locale={locale} perspective={perspective} />
              </TabsContent>
              <TabsContent value="spreadsheet" className="mt-0">
                <ProjectionSpreadsheet months={12} locale={locale} perspective={perspective} />
              </TabsContent>
              <TabsContent value="cohort" className="mt-0">
                <CohortSpreadsheet
                  months={36}
                  locale={locale}
                  perspective={perspective}
                  onPerspectiveChange={setPerspective}
                />
              </TabsContent>
              <TabsContent value="metrics" className="mt-0">
                <MetricsPanel multiplier={periodMultiplier} periodLabel={periodLabel} locale={locale} perspective={perspective} />
              </TabsContent>
              <TabsContent value="charts" className="mt-0">
                <FinancialCharts multiplier={periodMultiplier} periodLabel={periodLabel} locale={locale} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Remix Model Dialog */}
      <Dialog open={remixOpen} onOpenChange={setRemixOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t("financials.toolbar.remix_dialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("financials.toolbar.remix_dialog.description")}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t("financials.toolbar.remix_dialog.placeholder")}
            value={remixPrompt}
            onChange={(e) => setRemixPrompt(e.target.value)}
            className="min-h-[140px] resize-none"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemixOpen(false)}
              disabled={remixing}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button onClick={handleRemix} disabled={remixing}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {remixing
                ? t("financials.toolbar.button.remixing")
                : t("financials.toolbar.button.remix")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Model Dialog */}
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              {t("financials.toolbar.duplicate_dialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("financials.toolbar.duplicate_dialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("financials.toolbar.duplicate_dialog.color_label")}
              </label>
              <div className="flex items-center gap-1.5">
                {MODEL_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={t(MODEL_COLOR_NAME_KEYS[c.name])}
                    onClick={() => setDuplicateColor(c.value)}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                      duplicateColor === c.value
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: c.value }}
                  >
                    {duplicateColor === c.value && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("financials.toolbar.duplicate_dialog.name_label")}
              </label>
              <Input
                placeholder={t("financials.toolbar.model_name_placeholder")}
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                className="text-sm"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDuplicateOpen(false)}
              disabled={duplicating}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button onClick={handleDuplicate} disabled={duplicating}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              {duplicating
                ? t("financials.toolbar.button.duplicating")
                : t("financials.toolbar.button.duplicate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Model Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-4 w-4" />
              {t("financials.toolbar.delete_dialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("financials.toolbar.delete_dialog.description_prefix")}{" "}
              <strong>{modelName}</strong>
              {t("financials.toolbar.delete_dialog.description_suffix")}{" "}
              {t("common.confirmations.this_cannot_be_undone")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {deleting
                ? t("financials.toolbar.button.deleting")
                : t("common.actions.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

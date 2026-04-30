"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFinancialStore } from "@/stores/financial-store";
import type {
  TierFinancialInput,
  PartnerKickbackInput,
  CommissionCalcInput,
  SalesRepChannel,
  SamplerChannel,
  FinancialInputs,
  OperationalOverhead,
  FullyLoadedCommissionInput,
} from "@/lib/financial-engine";
import type { OpexCategoryData } from "@/lib/opex-resolver";
import type { DataSourceMeta, TierDisplayMeta } from "@/app/admin/financials/data";
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
  // New: fully-loaded commission plan data
  fullyLoadedCommissionData?: FullyLoadedCommissionInput;
  // New: data source metadata for UI indicators
  dataSourceMeta?: DataSourceMeta;
  // New: tier display metadata for read-only plan structure display
  tierDisplayMeta?: TierDisplayMeta[];
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
  fullyLoadedCommissionData,
  dataSourceMeta,
  tierDisplayMeta,
  locale,
}: FinancialPageClientProps) {
  const router = useRouter();
  const t = useT();
  const { setInputs, inputs, results, loadInputs } = useFinancialStore();
  const initialized = useRef<boolean | null>(null);
  const [modelName, setModelName] = useState(initialName);
  const [modelColor, setModelColor] = useState(initialColor);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(!modelId);

  // Time period for projection
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
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

  if (initialized.current == null) {
    initialized.current = true;
    if (initialInputs) {
      // For existing models, inject current OPEX data if the model uses milestone-scaled mode
      const migratedInputs = { ...initialInputs };
      if (migratedInputs.operationalOverhead?.mode === "milestone-scaled" && opexData.length > 0) {
        migratedInputs.operationalOverhead = { ...migratedInputs.operationalOverhead, opexData };
      }
      loadInputs(migratedInputs, initialName);
    } else {
      // New model: initialize with all available structured data
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
  }

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

  const periodMultiplier = getTimePeriodMultiplier(timePeriod, customMonths);
  const periodLabel = getTimePeriodLabel(timePeriod, customMonths, t);

  return (
    <div className="flex flex-col -m-6 h-[100vh] overflow-hidden">
      {/* Header — breadcrumb + buttons, with border underneath */}
      <div className="flex items-center justify-between shrink-0 border-b py-4 px-4">
        {/* Left: breadcrumb */}
        <nav className="flex items-center gap-2 text-base">
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

      {/* Main content: 50/50 split (or full-width when fullScreen) */}
      <div className={cn(
        "gap-4 flex-1 min-h-0 p-4",
        fullScreen ? "flex" : "grid grid-cols-2"
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
                locale={locale}
              />
            </div>
          </div>
        )}

        {/* Right: Projection */}
        <Tabs defaultValue="summary" className={cn("flex flex-col min-h-0", fullScreen && "flex-1")}>
          <div className="rounded-xl border bg-card flex flex-col min-h-0 flex-1">
            <div className="px-4 flex items-center justify-between shrink-0" style={{ height: 68 }}>
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold">
                  {t("financials.toolbar.projection_title")}
                </h2>
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
              </div>
              <div className="flex items-center gap-2">
                <TabsList className="h-8">
                  <TabsTrigger value="summary" className="text-xs px-3 h-6">
                    {t("financials.toolbar.tab.summary")}
                  </TabsTrigger>
                  <TabsTrigger value="statement" className="text-xs px-3 h-6">
                    {t("financials.toolbar.tab.statement")}
                  </TabsTrigger>
                  <TabsTrigger value="spreadsheet" className="text-xs px-3 h-6">
                    {t("financials.toolbar.tab.spreadsheet")}
                  </TabsTrigger>
                  <TabsTrigger value="cohort" className="text-xs px-3 h-6">
                    {t("financials.toolbar.tab.cohort")}
                  </TabsTrigger>
                  <TabsTrigger value="metrics" className="text-xs px-3 h-6">
                    {t("financials.toolbar.tab.metrics")}
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="text-xs px-3 h-6">
                    {t("financials.toolbar.tab.charts")}
                  </TabsTrigger>
                </TabsList>
                <button
                  type="button"
                  onClick={() => setFullScreen(!fullScreen)}
                  className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
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
            </div>
            <div className="border-t" />
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              <TabsContent value="summary" className="mt-0">
                <ExecutiveSummary locale={locale} />
              </TabsContent>
              <TabsContent value="statement" className="mt-0">
                <PLStatement multiplier={periodMultiplier} periodLabel={periodLabel} locale={locale} />
              </TabsContent>
              <TabsContent value="spreadsheet" className="mt-0">
                <ProjectionSpreadsheet months={12} locale={locale} />
              </TabsContent>
              <TabsContent value="cohort" className="mt-0">
                <CohortSpreadsheet months={12} locale={locale} />
              </TabsContent>
              <TabsContent value="metrics" className="mt-0">
                <MetricsPanel multiplier={periodMultiplier} periodLabel={periodLabel} locale={locale} />
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

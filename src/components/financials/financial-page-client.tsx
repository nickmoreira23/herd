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
} from "@/lib/financial-engine";
import type { OpexCategoryData } from "@/lib/opex-resolver";
import { ScenarioBuilder } from "./scenario-builder";
import { ExecutiveSummary } from "./executive-summary";
import { MetricsPanel } from "./metrics-panel";
import { FinancialCharts } from "./financial-charts";
import { PLStatement } from "./pl-statement";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export type TimePeriod = "month" | "quarter" | "semester" | "year" | "custom";

export const TIME_PERIOD_CONFIG: Record<
  TimePeriod,
  { label: string; multiplier: number; months: number }
> = {
  month: { label: "Month", multiplier: 1, months: 1 },
  quarter: { label: "Quarter", multiplier: 3, months: 3 },
  semester: { label: "Semester", multiplier: 6, months: 6 },
  year: { label: "Year", multiplier: 12, months: 12 },
  custom: { label: "Custom", multiplier: 1, months: 1 }, // placeholder, overridden by customMonths
};

export function getTimePeriodMultiplier(
  timePeriod: TimePeriod,
  customMonths: number
): number {
  if (timePeriod === "custom") return customMonths;
  return TIME_PERIOD_CONFIG[timePeriod].multiplier;
}

export function getTimePeriodLabel(
  timePeriod: TimePeriod,
  customMonths: number
): string {
  if (timePeriod === "custom") return `${customMonths}-Month`;
  return TIME_PERIOD_CONFIG[timePeriod].label;
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

interface FinancialPageClientProps {
  tierData: TierFinancialInput[];
  commissionData: CommissionCalcInput;
  salesRepData: SalesRepChannel;
  samplerData: SamplerChannel;
  partnerData: PartnerKickbackInput[];
  overheadData: OperationalOverhead;
  opexData: OpexCategoryData[];
  modelId?: string;
  initialName?: string;
  initialColor?: string;
  initialInputs?: FinancialInputs;
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
}: FinancialPageClientProps) {
  const router = useRouter();
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
      setInputs({
        tiers: tierData,
        commissionStructure: commissionData,
        salesRepChannel: salesRepData,
        samplerChannel: samplerData,
        partnerKickbacks: partnerData,
        operationalOverhead: overheadData,
      });
    }
  }

  const handleSave = useCallback(async () => {
    if (!modelName.trim()) {
      toast.error("Enter a model name");
      return;
    }
    if (!results) {
      toast.error("No results to save");
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
        const json = await res.json();
        toast.error(json.error || "Failed to save");
        return;
      }
      toast.success(modelId ? "Model updated" : "Model saved");
      router.push("/admin/operation/finances/projections");
    } finally {
      setSaving(false);
    }
  }, [modelName, modelColor, inputs, results, modelId, router]);

  const handleRemix = useCallback(async () => {
    if (!remixPrompt.trim()) {
      toast.error("Describe the changes you want");
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
        const json = await res.json();
        toast.error(json.error || "Remix failed");
        return;
      }
      const { inputs: newInputs } = await res.json();
      loadInputs(newInputs, modelName);
      setEditing(true);
      setRemixOpen(false);
      setRemixPrompt("");
      toast.success("Model remixed — review the updated premises");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setRemixing(false);
    }
  }, [remixPrompt, inputs, loadInputs, modelName]);

  const handleDuplicate = useCallback(async () => {
    if (!duplicateName.trim()) {
      toast.error("Enter a name for the duplicate");
      return;
    }
    if (!results) {
      toast.error("No results to duplicate");
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
        const json = await res.json();
        toast.error(json.error || "Failed to duplicate");
        return;
      }
      const newSnapshot = await res.json();
      toast.success("Model duplicated");
      setDuplicateOpen(false);
      setDuplicateName("");
      router.push(`/admin/operation/finances/projections/${newSnapshot.data.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDuplicating(false);
    }
  }, [duplicateName, duplicateColor, inputs, results, router]);

  const handleDelete = useCallback(async () => {
    if (!modelId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/financials/${modelId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to delete");
        return;
      }
      toast.success("Model deleted");
      setDeleteOpen(false);
      router.push("/admin/operation/finances/projections");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }, [modelId, router]);

  const isNewModel = !modelId;

  const periodMultiplier = getTimePeriodMultiplier(timePeriod, customMonths);
  const periodLabel = getTimePeriodLabel(timePeriod, customMonths);

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
            Finances
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {editing ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                {MODEL_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
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
                placeholder="Model name..."
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
              {saving ? "Saving..." : "Save Model"}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md border border-input bg-background h-8 w-8 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRemixOpen(true)}>
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  Remix
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setDuplicateName(`${modelName} (Copy)`);
                    setDuplicateColor(modelColor);
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

      {/* Main content: 50/50 split — 16px on all sides */}
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 p-4">
        {/* Left: Premises */}
        <div className="rounded-xl border bg-card flex flex-col min-h-0">
          <div className="px-4 flex items-center shrink-0" style={{ height: 68 }}>
            <h2 className="text-sm font-semibold">Premises</h2>
          </div>
          <div className="border-t" />
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            <ScenarioBuilder readOnly={!editing} defaultOpen={editing || isNewModel} />
          </div>
        </div>

        {/* Right: Projection */}
        <Tabs defaultValue="summary" className="flex flex-col min-h-0">
          <div className="rounded-xl border bg-card flex flex-col min-h-0 flex-1">
            <div className="px-4 flex items-center justify-between shrink-0" style={{ height: 68 }}>
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold">Projection</h2>
                <div className="flex items-center gap-2">
                  <Select
                    value={timePeriod}
                    onValueChange={(v) => setTimePeriod(v as TimePeriod)}
                  >
                    <SelectTrigger className="h-7 w-[110px] text-xs border-dashed capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month" className="text-xs">Month</SelectItem>
                      <SelectItem value="quarter" className="text-xs">Quarter</SelectItem>
                      <SelectItem value="semester" className="text-xs">Semester</SelectItem>
                      <SelectItem value="year" className="text-xs">Year</SelectItem>
                      <SelectItem value="custom" className="text-xs">Custom</SelectItem>
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
                      <span className="text-[10px] text-muted-foreground">mo</span>
                    </div>
                  )}
                </div>
              </div>
              <TabsList className="h-8">
                <TabsTrigger value="summary" className="text-xs px-3 h-6">
                  Summary
                </TabsTrigger>
                <TabsTrigger value="statement" className="text-xs px-3 h-6">
                  Statement
                </TabsTrigger>
                <TabsTrigger value="metrics" className="text-xs px-3 h-6">
                  Metrics
                </TabsTrigger>
                <TabsTrigger value="charts" className="text-xs px-3 h-6">
                  Charts
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="border-t" />
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              <TabsContent value="summary" className="mt-0">
                <ExecutiveSummary />
              </TabsContent>
              <TabsContent value="statement" className="mt-0">
                <PLStatement multiplier={periodMultiplier} periodLabel={periodLabel} />
              </TabsContent>
              <TabsContent value="metrics" className="mt-0">
                <MetricsPanel multiplier={periodMultiplier} periodLabel={periodLabel} />
              </TabsContent>
              <TabsContent value="charts" className="mt-0">
                <FinancialCharts multiplier={periodMultiplier} periodLabel={periodLabel} />
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
              Remix Model
            </DialogTitle>
            <DialogDescription>
              Describe how you want to change the projection. An AI agent will
              adjust the premise values and generate updated projections.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g., Make this more aggressive — start with 20 reps growing at 15%/mo, double the sampler spend, and reduce overhead to $15k..."
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
              Cancel
            </Button>
            <Button onClick={handleRemix} disabled={remixing}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {remixing ? "Remixing..." : "Remix"}
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
              Duplicate Model
            </DialogTitle>
            <DialogDescription>
              Create a copy of this model with a new name and color. All premises
              and projections will be duplicated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex items-center gap-1.5">
                {MODEL_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
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
              <label className="text-sm font-medium">Model Name</label>
              <Input
                placeholder="Model name..."
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
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={duplicating}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              {duplicating ? "Duplicating..." : "Duplicate"}
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
              Delete Model
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{modelName}</strong>? This
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

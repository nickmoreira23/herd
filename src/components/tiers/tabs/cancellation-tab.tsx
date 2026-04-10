"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldX, Pause, Gift, ClipboardList } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { TierFormState } from "../tier-detail-client";

interface CancellationTabProps {
  form: TierFormState;
  updateForm: (field: string, value: unknown) => void;
  onBlurSave?: () => void;
}

export function CancellationTab({ form, updateForm, onBlurSave }: CancellationTabProps) {
  return (
    <div className="grid grid-cols-[1fr_300px] gap-6">
      {/* Left — Fields */}
      <div className="space-y-6">
        {/* Commitment */}
        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <div className="flex items-center gap-1.5">
            <ShieldX className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider">Commitment</span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Minimum Commitment (months)</Label>
            <Input
              type="number"
              min="1"
              value={form.minimumCommitMonths}
              onChange={(e) => updateForm("minimumCommitMonths", e.target.value)}
              onBlur={onBlurSave}
            />
            <p className="text-[10px] text-muted-foreground">
              Subscriber must stay for at least this many months. 1 = no commitment.
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
            <Switch
              checked={form.exitSurveyRequired}
              onCheckedChange={(val) => {
                updateForm("exitSurveyRequired", val);
                onBlurSave?.();
              }}
            />
            <div>
              <span className="text-sm font-medium">Exit Survey Required</span>
              <p className="text-[10px] text-muted-foreground">Show a cancellation survey before processing</p>
            </div>
          </label>
        </div>

        {/* Pause */}
        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <div className="flex items-center gap-1.5">
            <Pause className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider">Pause Options</span>
          </div>

          <label className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
            <Switch
              checked={form.pauseAllowed}
              onCheckedChange={(val) => {
                updateForm("pauseAllowed", val);
                onBlurSave?.();
              }}
            />
            <div>
              <span className="text-sm font-medium">Allow Plan Pause</span>
              <p className="text-[10px] text-muted-foreground">Members can temporarily pause instead of cancelling</p>
            </div>
          </label>

          {form.pauseAllowed && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Max Pause Duration (months)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.pauseMaxMonths}
                  onChange={(e) => updateForm("pauseMaxMonths", e.target.value)}
                  onBlur={onBlurSave}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Credits While Paused</Label>
                <Select
                  value={form.pauseCreditBehavior}
                  onValueChange={(val) => {
                    updateForm("pauseCreditBehavior", val ?? "FROZEN");
                    onBlurSave?.();
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FROZEN">Frozen (kept)</SelectItem>
                    <SelectItem value="FORFEIT">Forfeited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Win-back */}
        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
          <div className="flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider">Win-back Offer</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Win-back Window (days)</Label>
              <Input
                type="number"
                min="0"
                value={form.winbackDays}
                onChange={(e) => updateForm("winbackDays", e.target.value)}
                onBlur={onBlurSave}
              />
              <p className="text-[10px] text-muted-foreground">
                0 = no win-back offer. Days after cancellation to show the offer.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Win-back Bonus Credits ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.winbackBonusCredits}
                  onChange={(e) => updateForm("winbackBonusCredits", e.target.value)}
                  onBlur={onBlurSave}
                  className="pl-7"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Bonus credits offered if they re-subscribe within the window.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Retention Flow Preview */}
      <div className="sticky top-0">
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Retention Flow
            </span>
          </div>

          <div className="space-y-3">
            <FlowStep
              step={1}
              label="Cancel Request"
              detail={
                form.exitSurveyRequired
                  ? "Show exit survey"
                  : "No survey — direct to confirmation"
              }
              active
            />
            <FlowStep
              step={2}
              label="Commitment Check"
              detail={
                parseInt(form.minimumCommitMonths) > 1
                  ? `Must have been active for ${form.minimumCommitMonths} months`
                  : "No minimum commitment"
              }
              active={parseInt(form.minimumCommitMonths) > 1}
            />
            <FlowStep
              step={3}
              label="Pause Offer"
              detail={
                form.pauseAllowed
                  ? `Offer pause up to ${form.pauseMaxMonths} months (credits: ${form.pauseCreditBehavior === "FROZEN" ? "frozen" : "forfeited"})`
                  : "Pausing not available"
              }
              active={form.pauseAllowed}
            />
            <FlowStep
              step={4}
              label="Process Cancellation"
              detail="Plan ends at current cycle end"
              active
            />
            {parseInt(form.winbackDays) > 0 && (
              <FlowStep
                step={5}
                label="Win-back Email"
                detail={`Send after cancellation with ${formatCurrency(parseFloat(form.winbackBonusCredits) || 0)} bonus — valid for ${form.winbackDays} days`}
                active
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowStep({
  step,
  label,
  detail,
  active,
}: {
  step: number;
  label: string;
  detail: string;
  active: boolean;
}) {
  return (
    <div className={`flex gap-3 ${active ? "" : "opacity-40"}`}>
      <div className="flex flex-col items-center">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
            active ? "bg-[#C5F135]/20 text-[#C5F135]" : "bg-muted text-muted-foreground"
          }`}
        >
          {step}
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="pb-4">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

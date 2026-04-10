"use client";

import { useMemo } from "react";
import type { AgentFormState } from "../agent-detail-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gauge } from "lucide-react";

interface LimitsTabProps {
  form: AgentFormState;
  updateForm: (field: string, value: unknown) => void;
  onBlurSave?: () => void;
}

export function LimitsTab({ form, updateForm, onBlurSave }: LimitsTabProps) {
  const estimatedDailyCost = useMemo(() => {
    const limit = parseInt(form.dailyUsageLimit) || 0;
    const tokens = parseInt(form.avgTokensPerCall) || 0;
    if (!limit || !tokens) return null;
    // rough estimate: $0.01 per 1k tokens (varies by model)
    return ((limit * tokens) / 1000) * 0.01;
  }, [form.dailyUsageLimit, form.avgTokensPerCall]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
        <div className="flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Usage Limits
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="daily-limit">Daily Limit</Label>
            <Input
              id="daily-limit"
              type="number"
              value={form.dailyUsageLimit}
              onChange={(e) => updateForm("dailyUsageLimit", e.target.value)}
              onBlur={onBlurSave}
              placeholder="Unlimited"
            />
            <p className="text-[10px] text-muted-foreground">
              Max uses per member per day
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monthly-cost">Monthly Cost ($)</Label>
            <Input
              id="monthly-cost"
              type="number"
              step="0.01"
              value={form.monthlyCostEstimate}
              onChange={(e) =>
                updateForm("monthlyCostEstimate", e.target.value)
              }
              onBlur={onBlurSave}
              placeholder="0.00"
            />
            <p className="text-[10px] text-muted-foreground">
              Estimated cost per active user
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="avg-tokens">Avg Tokens/Call</Label>
            <Input
              id="avg-tokens"
              type="number"
              value={form.avgTokensPerCall}
              onChange={(e) => updateForm("avgTokensPerCall", e.target.value)}
              onBlur={onBlurSave}
              placeholder="0"
            />
            <p className="text-[10px] text-muted-foreground">
              Average tokens per invocation
            </p>
          </div>
        </div>
      </div>

      {/* Computed cost estimate */}
      {estimatedDailyCost !== null && (
        <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cost Estimate
          </span>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">
                Est. daily cost per user
              </p>
              <p className="font-mono font-semibold">
                ${estimatedDailyCost.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                Est. monthly cost per user
              </p>
              <p className="font-mono font-semibold">
                ${(estimatedDailyCost * 30).toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Based on ~$0.01/1k tokens. Actual cost varies by model and provider.
          </p>
        </div>
      )}
    </div>
  );
}

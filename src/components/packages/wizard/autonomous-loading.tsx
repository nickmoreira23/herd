"use client";

import { Sparkles, Check, Loader2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  usePackageWizardStore,
  type AutonomousStatus,
} from "@/stores/package-wizard-store";

export function AutonomousLoading() {
  const { tiers, autonomousStatus } = usePackageWizardStore();
  const status = autonomousStatus ?? {
    phase: "idle",
    currentTier: null,
    completedTiers: [],
    error: null,
  };

  const phaseLabel: Record<string, string> = {
    idle: "Preparing...",
    creating: "Creating package...",
    suggesting: "Generating product recommendations...",
    saving: "Saving products...",
    done: "Package created!",
    error: "Something went wrong",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <div className="flex flex-col items-center gap-6 py-8">
        {/* Pulsing icon */}
        {status.phase !== "error" && status.phase !== "done" && (
          <div className="h-16 w-16 rounded-2xl bg-[#C5F135]/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-[#C5F135] animate-pulse" />
          </div>
        )}

        {status.phase === "done" && (
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
        )}

        {status.phase === "error" && (
          <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center">
            <Circle className="h-8 w-8 text-red-600" />
          </div>
        )}

        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold">{phaseLabel[status.phase]}</h3>
          {status.phase !== "error" && status.phase !== "done" && (
            <p className="text-sm text-muted-foreground">
              This usually takes 30-60 seconds
            </p>
          )}
          {status.error && (
            <p className="text-sm text-red-600 mt-2">{status.error}</p>
          )}
        </div>

        {/* Tier progress */}
        {tiers.length > 0 && (
          <div className="w-full max-w-sm space-y-2 mt-2">
            {tiers.map((tier) => {
              const isCompleted = status.completedTiers.includes(tier.id);
              const isActive = status.currentTier === tier.id;

              return (
                <div
                  key={tier.id}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border"
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: tier.colorAccent }}
                  />
                  <span className="text-sm font-medium flex-1">{tier.name}</span>
                  {isCompleted && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Check className="h-3.5 w-3.5" />
                      <span className="text-xs">Complete</span>
                    </div>
                  )}
                  {isActive && !isCompleted && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-xs">Generating...</span>
                    </div>
                  )}
                  {!isCompleted && !isActive && (
                    <span className="text-xs text-muted-foreground">Pending</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

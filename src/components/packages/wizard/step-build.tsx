"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { TierTabBar } from "./tier-tab-bar";
import { TierProductEditor } from "./tier-product-editor";
import { WizardAiPanel } from "./wizard-ai-panel";
import {
  usePackageWizardStore,
  type TierInfo,
} from "@/stores/package-wizard-store";
import type { RedemptionRule } from "@/lib/credit-cost";

interface StepBuildProps {
  onNext: () => void;
  onBack: () => void;
  tiers: TierInfo[];
  redemptionRulesByTier: Record<string, RedemptionRule[]>;
}

export function StepBuild({
  onNext,
  onBack,
  tiers,
  redemptionRulesByTier,
}: StepBuildProps) {
  const router = useRouter();
  const {
    packageId,
    tiers: wizardTiers,
    activeTierId,
    tierProducts,
    fitnessGoal,
    customGoalDescription,
    creationPath,
    preferences,
    analysisRecommendations,
    setActiveTier,
    reset,
  } = usePackageWizardStore();

  const [showAiPanel, setShowAiPanel] = useState<Record<string, boolean>>({});
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const copilotAutoTriggered = useRef(false);

  const activeTier = wizardTiers.find((t) => t.id === activeTierId) ?? wizardTiers[0];
  const activeRules = activeTier ? (redemptionRulesByTier[activeTier.id] || []) : [];

  // Count configured tiers
  const configuredCount = wizardTiers.filter(
    (t) => (tierProducts[t.id]?.products.length ?? 0) > 0
  ).length;

  const handleTriggerAi = useCallback(() => {
    if (activeTier) {
      setShowAiPanel((prev) => ({ ...prev, [activeTier.id]: true }));
    }
  }, [activeTier]);

  // In co-pilot mode, auto-show AI panel for ALL tiers when first arriving at this step
  useEffect(() => {
    if (creationPath === "copilot" && !copilotAutoTriggered.current && wizardTiers.length > 0) {
      copilotAutoTriggered.current = true;
      const panels: Record<string, boolean> = {};
      for (const tier of wizardTiers) {
        if (!tierProducts[tier.id]?.aiRun) {
          panels[tier.id] = true;
        }
      }
      setShowAiPanel((prev) => ({ ...prev, ...panels }));
    }
  }, [creationPath, wizardTiers, tierProducts]);

  const handleSelectTier = useCallback(
    (tierId: string) => {
      setActiveTier(tierId);
      // In co-pilot, always show AI panel if not already run
      if (creationPath === "copilot" && !tierProducts[tierId]?.aiRun) {
        setShowAiPanel((prev) => ({ ...prev, [tierId]: true }));
      }
    },
    [setActiveTier, creationPath, tierProducts]
  );

  async function handleCancel() {
    setCancelling(true);
    try {
      if (packageId) {
        await fetch(`/api/packages/${packageId}`, { method: "DELETE" });
      }
    } catch {
      // best-effort cleanup
    }
    reset();
    router.push("/admin/program/packages");
  }

  return (
    <div className="space-y-0">
      {/* Tier tab bar */}
      <TierTabBar
        tiers={wizardTiers}
        activeTierId={activeTierId}
        tierProducts={tierProducts}
        onSelectTier={handleSelectTier}
      />

      {/* Hidden AI panels for non-active tiers (mount to auto-trigger all simultaneously) */}
      {wizardTiers
        .filter((t) => t.id !== activeTierId)
        .map((tier) => {
          const shouldMount =
            (showAiPanel[tier.id] || tierProducts[tier.id]?.aiRun) && packageId;
          if (!shouldMount) return null;
          return (
            <div key={`ai-bg-${tier.id}`} className="hidden" aria-hidden="true">
              <WizardAiPanel
                packageId={packageId!}
                subscriptionTierId={tier.id}
                fitnessGoal={fitnessGoal}
                customGoalDescription={customGoalDescription}
                preferences={preferences}
                recommendations={analysisRecommendations}
                autoTrigger={
                  creationPath === "copilot" && !tierProducts[tier.id]?.aiRun
                }
              />
            </div>
          );
        })}

      {/* Active tier content */}
      {activeTier && (
        <div className="rounded-b-xl rounded-tr-xl border border-border bg-card p-6 space-y-5">
          {/* Tier header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: activeTier.colorAccent }}
              />
              <h3 className="font-semibold">{activeTier.name}</h3>
              <Badge variant="secondary" className="text-xs">
                ${activeTier.monthlyCredits.toFixed(0)} credits/mo
              </Badge>
            </div>
            <Badge variant="outline" className="text-xs">
              {tierProducts[activeTier.id]?.products.length ?? 0} product
              {(tierProducts[activeTier.id]?.products.length ?? 0) !== 1
                ? "s"
                : ""}
            </Badge>
          </div>

          {/* AI Panel (if triggered) */}
          {(showAiPanel[activeTier.id] || tierProducts[activeTier.id]?.aiRun) &&
            packageId && (
              <WizardAiPanel
                packageId={packageId}
                subscriptionTierId={activeTier.id}
                fitnessGoal={fitnessGoal}
                customGoalDescription={customGoalDescription}
                preferences={preferences}
                recommendations={analysisRecommendations}
                autoTrigger={
                  creationPath === "copilot" && !tierProducts[activeTier.id]?.aiRun
                }
              />
            )}

          {/* Product editor */}
          <TierProductEditor
            tier={activeTier}
            redemptionRules={activeRules}
            onTriggerAi={handleTriggerAi}
          />
        </div>
      )}

      {/* Navigation footer */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            variant="ghost"
            className="text-red-500 hover:text-red-700"
            onClick={() => setCancelOpen(true)}
          >
            Cancel
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {configuredCount < wizardTiers.length && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {configuredCount}/{wizardTiers.length} tiers configured
            </span>
          )}
          <Button onClick={onNext}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Next: Identity
          </Button>
        </div>
      </div>

      {/* Cancel confirmation */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard Package?</DialogTitle>
            <DialogDescription>
              This will delete the draft package and all progress. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Keep Working
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? "Deleting..." : "Discard Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

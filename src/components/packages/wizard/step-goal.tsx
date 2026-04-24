"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FitnessGoalPicker } from "./fitness-goal-picker";
import { AutonomousLoading } from "./autonomous-loading";
import {
  usePackageWizardStore,
  type TierInfo,
  type LocalProduct,
} from "@/stores/package-wizard-store";

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: "Weight Loss",
  MUSCLE_GAIN: "Muscle Gain",
  PERFORMANCE: "Performance",
  ENDURANCE: "Endurance",
  GENERAL_WELLNESS: "General Wellness",
  RECOVERY: "Recovery",
  STRENGTH: "Strength",
  BODY_RECOMP: "Body Recomp",
  CUSTOM: "Custom",
};

const DEFAULT_IMAGES: Record<string, string> = {
  WEIGHT_LOSS: "/images/packages/weight-loss.svg",
  MUSCLE_GAIN: "/images/packages/muscle-gain.svg",
  PERFORMANCE: "/images/packages/performance.svg",
  ENDURANCE: "/images/packages/endurance.svg",
  GENERAL_WELLNESS: "/images/packages/general-wellness.svg",
  RECOVERY: "/images/packages/recovery.svg",
  STRENGTH: "/images/packages/strength.svg",
  BODY_RECOMP: "/images/packages/body-recomp.svg",
  CUSTOM: "/images/packages/custom.svg",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface StepGoalProps {
  onNext: () => void;
  onBack: () => void;
  tiers: TierInfo[];
}

interface SseSuggestion {
  productId: string;
  productName: string;
  quantity: number;
  creditCost: number;
  totalCost: number;
  reasoning: string;
  matchedType: string;
  sku?: string;
  subCategory?: string | null;
  category?: string | null;
  memberPrice?: number;
  retailPrice?: number;
  imageUrl?: string | null;
  costOfGoods?: number;
  shippingCost?: number;
  handlingCost?: number;
  paymentProcessingPct?: number;
  paymentProcessingFlat?: number;
}

/** Consume the SSE stream from ai-suggest and return parsed suggestions */
async function consumeAiSuggestStream(
  packageId: string,
  subscriptionTierId: string,
  fitnessGoal: string
): Promise<SseSuggestion[]> {
  const res = await fetch(`/api/packages/${packageId}/ai-suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscriptionTierId, fitnessGoal, mode: "products" }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error || "AI suggestion failed");
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";
  let suggestions: SseSuggestion[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    let eventType = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7);
      } else if (line.startsWith("data: ") && eventType) {
        try {
          const data = JSON.parse(line.slice(6));
          if (eventType === "suggestions") {
            suggestions = data.suggestions || [];
          } else if (eventType === "error") {
            throw new Error(data.message || "AI suggestion failed");
          }
        } catch (e) {
          if (e instanceof Error && e.message !== "AI suggestion failed") {
            // malformed JSON, skip
          } else {
            throw e;
          }
        }
        eventType = "";
      }
    }
  }

  return suggestions;
}

export function StepGoal({ onNext, onBack, tiers }: StepGoalProps) {
  const {
    fitnessGoal,
    customGoalDescription,
    creationPath,
    setFitnessGoal,
    setCustomGoalDescription,
    setPackageCreated,
    setImageUrl,
    setName,
    setDescription,
    addProduct,
    markAiRun,
    setAutonomousStatus,
    markStepComplete,
    setStep,
  } = usePackageWizardStore();

  const [creating, setCreating] = useState(false);
  const [isAutonomousRunning, setIsAutonomousRunning] = useState(false);

  const canProceed =
    fitnessGoal.length > 0 &&
    (fitnessGoal !== "CUSTOM" || customGoalDescription.trim().length > 0);
  const goalLabel =
    fitnessGoal === "CUSTOM" && customGoalDescription.trim()
      ? customGoalDescription.trim().slice(0, 40)
      : GOAL_LABELS[fitnessGoal] || fitnessGoal;
  const defaultName = `${fitnessGoal === "CUSTOM" ? "Custom" : GOAL_LABELS[fitnessGoal] || fitnessGoal} Package`;
  const defaultImage = DEFAULT_IMAGES[fitnessGoal] || null;

  const createPackage = useCallback(async (): Promise<{
    packageId: string;
    createdTiers: TierInfo[];
  } | null> => {
    const slug = slugify(defaultName);
    const res = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: defaultName,
        slug: `${slug}-${Date.now()}`,
        fitnessGoal,
        customGoalDescription:
          fitnessGoal === "CUSTOM" ? customGoalDescription.trim() : null,
        description: null,
        imageUrl: defaultImage,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Failed to create package");
    }

    const createdTiers: TierInfo[] = (json.data.variants || [])
      .map(
        (v: {
          subscriptionTier: { id: string; name: string; monthlyCredits: number };
        }) => {
          const fullTier = tiers.find((t) => t.id === v.subscriptionTier.id);
          return fullTier ?? null;
        }
      )
      .filter(Boolean) as TierInfo[];

    createdTiers.sort((a, b) => a.sortOrder - b.sortOrder);

    return { packageId: json.data.id, createdTiers };
  }, [defaultName, fitnessGoal, customGoalDescription, defaultImage, tiers]);

  async function handleNext() {
    if (!canProceed) return;

    if (creationPath === "autonomous") {
      await runAutonomous();
      return;
    }

    // Manual or Co-Pilot: create package, then advance to Preferences
    setCreating(true);
    try {
      const result = await createPackage();
      if (!result) return;

      setPackageCreated(result.packageId, result.createdTiers);
      setImageUrl(defaultImage);
      setName(defaultName);
      onNext();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create package"
      );
    } finally {
      setCreating(false);
    }
  }

  async function runAutonomous() {
    setIsAutonomousRunning(true);
    setAutonomousStatus({
      phase: "creating",
      currentTier: null,
      completedTiers: [],
      error: null,
    });

    try {
      // Phase 1: Create package
      const result = await createPackage();
      if (!result) throw new Error("Failed to create package");

      const { packageId, createdTiers } = result;
      setPackageCreated(packageId, createdTiers);
      setImageUrl(defaultImage);
      setName(defaultName);

      // Phase 2: AI suggest for each tier
      setAutonomousStatus({
        phase: "suggesting",
        currentTier: createdTiers[0]?.id ?? null,
        completedTiers: [],
        error: null,
      });

      const completedTiers: string[] = [];

      for (const tier of createdTiers) {
        setAutonomousStatus({
          phase: "suggesting",
          currentTier: tier.id,
          completedTiers: [...completedTiers],
          error: null,
        });

        const suggestions = await consumeAiSuggestStream(
          packageId,
          tier.id,
          fitnessGoal
        );

        // Auto-accept all suggestions into store
        for (const s of suggestions) {
          const product: LocalProduct = {
            productId: s.productId,
            name: s.productName,
            sku: s.sku ?? "",
            category: s.category ?? "",
            subCategory: s.subCategory ?? null,
            imageUrl: s.imageUrl ?? null,
            memberPrice: s.memberPrice ?? s.creditCost,
            retailPrice: s.retailPrice ?? s.memberPrice ?? s.creditCost,
            quantity: s.quantity,
            creditCost: s.creditCost,
            costOfGoods: s.costOfGoods ?? 0,
            shippingCost: s.shippingCost ?? 0,
            handlingCost: s.handlingCost ?? 0,
            paymentProcessingPct: s.paymentProcessingPct ?? 0,
            paymentProcessingFlat: s.paymentProcessingFlat ?? 0,
          };
          addProduct(tier.id, product);
        }
        markAiRun(tier.id);
        completedTiers.push(tier.id);
      }

      // Phase 3: Save products to all tiers
      setAutonomousStatus({
        phase: "saving",
        currentTier: null,
        completedTiers,
        error: null,
      });

      for (const tier of createdTiers) {
        const state = usePackageWizardStore.getState();
        const tierState = state.tierProducts[tier.id];
        if (!tierState || tierState.products.length === 0) continue;

        await fetch(`/api/packages/${packageId}/variants/${tier.id}/products`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            products: tierState.products.map((p) => ({
              productId: p.productId,
              quantity: p.quantity,
              creditCost: p.creditCost,
            })),
          }),
        });
      }

      // Phase 4: Generate identity
      try {
        const identityRes = await fetch(
          `/api/packages/${packageId}/ai-identity`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fitnessGoal }),
          }
        );
        if (identityRes.ok) {
          const identityJson = await identityRes.json();
          if (identityJson.data?.name) setName(identityJson.data.name);
          if (identityJson.data?.description)
            setDescription(identityJson.data.description);

          // Persist to DB
          await fetch(`/api/packages/${packageId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: identityJson.data?.name || defaultName,
              slug: slugify(identityJson.data?.name || defaultName) + `-${Date.now()}`,
              description: identityJson.data?.description || null,
              imageUrl: defaultImage,
            }),
          });
        }
      } catch {
        // Identity generation is optional — continue with defaults
      }

      // Phase 5: Done — jump to review (step 7)
      setAutonomousStatus({
        phase: "done",
        currentTier: null,
        completedTiers,
        error: null,
      });

      for (let s = 1; s <= 6; s++) markStepComplete(s);
      setStep(7);
    } catch (err) {
      setAutonomousStatus({
        phase: "error",
        currentTier: null,
        completedTiers: [],
        error: err instanceof Error ? err.message : "Autonomous generation failed",
      });
      toast.error(
        err instanceof Error ? err.message : "Autonomous generation failed"
      );
    } finally {
      setIsAutonomousRunning(false);
    }
  }

  // Show loading screen during autonomous generation
  if (isAutonomousRunning) {
    return <AutonomousLoading />;
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Choose Your Fitness Goal</h2>
          <p className="text-sm text-muted-foreground mt-1">
            What&apos;s the primary focus for this package?
          </p>
        </div>

        <FitnessGoalPicker
          value={fitnessGoal}
          customDescription={customGoalDescription}
          onChange={setFitnessGoal}
          onCustomDescriptionChange={setCustomGoalDescription}
        />
      </div>

      <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30 rounded-b-xl">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed || creating}>
          {creating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4 mr-2" />
          )}
          {creating
            ? "Creating..."
            : creationPath === "autonomous"
              ? "Start Building"
              : "Next: Preferences"}
        </Button>
      </div>
    </div>
  );
}

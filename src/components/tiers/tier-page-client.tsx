"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import type { SubscriptionTier } from "@/types";
import { TierCard } from "./tier-card";
import { TierComparison } from "./tier-comparison";
import { TierCreateSheet } from "./tier-create-sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface TierPageClientProps {
  initialTiers: SubscriptionTier[];
}

const DEFAULT_SETTINGS = {
  redemptionRate: 0.75,
  cogsRatio: 0.2,
  breakageRate: 0.25,
  fulfillment: 3,
  shipping: 5,
  commissionResidual: 6,
  commissionBonus: 50,
};

// ─── Horizontal carousel with scroll-snap ────────────────────────
function TierCarousel({
  tiers,
  onDuplicate,
  onArchive,
  onDelete,
  onEmpty,
}: {
  tiers: SubscriptionTier[];
  onDuplicate: (t: SubscriptionTier) => void;
  onArchive: (t: SubscriptionTier) => void;
  onDelete: (t: SubscriptionTier) => void;
  onEmpty: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by one card width + gap
    const cardWidth = el.querySelector<HTMLElement>("[data-tier-card]")?.offsetWidth ?? 380;
    el.scrollBy({ left: direction === "left" ? -cardWidth - 16 : cardWidth + 16, behavior: "smooth" });
  }, []);

  // Check scroll state on mount and after scroll
  const handleRef = useCallback(
    (node: HTMLDivElement | null) => {
      (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (node) {
        updateScrollButtons();
        // Use ResizeObserver to update when container resizes
        const observer = new ResizeObserver(updateScrollButtons);
        observer.observe(node);
        return () => observer.disconnect();
      }
    },
    [updateScrollButtons]
  );

  if (tiers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No plans yet.</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={onEmpty}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Create your first plan
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 border shadow-md backdrop-blur-sm hover:bg-muted transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 border shadow-md backdrop-blur-sm hover:bg-muted transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={handleRef}
        onScroll={updateScrollButtons}
        className="flex gap-4 h-full overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "hsl(var(--border)) transparent",
        }}
      >
        {tiers.map((tier) => (
          <div
            key={tier.id}
            data-tier-card
            className="snap-start shrink-0"
            style={{ width: "min(380px, 85vw)" }}
          >
            <TierCard
              tier={tier}
              onDuplicate={onDuplicate}
              onArchive={onArchive}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TierPageClient({ initialTiers }: TierPageClientProps) {
  const [tiers, setTiers] = useState<SubscriptionTier[]>(initialTiers);
  const [showCreate, setShowCreate] = useState(false);

  const refreshTiers = useCallback(async () => {
    const res = await fetch("/api/tiers");
    const json = await res.json();
    if (json.data) setTiers(json.data);
  }, []);

  // Sort tiers by monthly price ascending (cheapest first)
  const sortedTiers = useMemo(
    () => [...tiers].sort((a, b) => Number(a.monthlyPrice) - Number(b.monthlyPrice)),
    [tiers]
  );


  const handleDuplicate = useCallback(
    async (tier: SubscriptionTier) => {
      const t = tier as Record<string, unknown>;
      const res = await fetch("/api/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${tier.name} (Copy)`,
          slug: `${tier.slug}-copy-${Date.now()}`,
          status: "DRAFT",
          visibility: t.visibility || "PUBLIC",
          tagline: t.tagline || null,
          colorAccent: t.colorAccent || "#6B7280",
          // Pricing
          monthlyPrice: tier.monthlyPrice,
          quarterlyPrice: tier.quarterlyPrice,
          annualPrice: tier.annualPrice,
          quarterlyDisplay: t.quarterlyDisplay ?? null,
          annualDisplay: t.annualDisplay ?? null,
          setupFee: t.setupFee ?? 0,
          trialDays: t.trialDays ?? 0,
          billingAnchor: t.billingAnchor || "SIGNUP_DATE",
          // Credits
          monthlyCredits: tier.monthlyCredits,
          creditExpirationDays: tier.creditExpirationDays,
          creditIssuing: t.creditIssuing || "ON_PAYMENT",
          rolloverMonths: t.rolloverMonths ?? 0,
          rolloverCap: t.rolloverCap ?? null,
          creditExpiry: t.creditExpiry || "FORFEIT",
          annualBonusCredits: t.annualBonusCredits ?? 0,
          referralCreditAmt: t.referralCreditAmt ?? 0,
          partnerDiscountPercent: tier.partnerDiscountPercent,
          // Features
          includedAIFeatures: tier.includedAIFeatures,
          apparelCadence: tier.apparelCadence,
          apparelBudget: tier.apparelBudget,
          iconUrl: tier.iconUrl || undefined,
          isActive: false,
          isFeatured: false,
          description: tier.description,
          highlightFeatures: tier.highlightFeatures,
          // Access
          maxMembers: t.maxMembers ?? null,
          geoRestriction: t.geoRestriction || [],
          minimumAge: t.minimumAge ?? null,
          inviteOnly: t.inviteOnly ?? false,
          repChannelOnly: t.repChannelOnly ?? false,
          // Tier movement
          upgradeToTierIds: t.upgradeToTierIds || [],
          downgradeToTierIds: t.downgradeToTierIds || [],
          upgradeTiming: t.upgradeTiming || "IMMEDIATE",
          downgradeTiming: t.downgradeTiming || "NEXT_CYCLE",
          creditOnUpgrade: t.creditOnUpgrade || "CARRY_OVER",
          creditOnDowngrade: t.creditOnDowngrade || "FORFEIT_EXCESS",
          // Cancellation
          minimumCommitMonths: t.minimumCommitMonths ?? 1,
          pauseAllowed: t.pauseAllowed ?? false,
          pauseMaxMonths: t.pauseMaxMonths ?? 0,
          pauseCreditBehavior: t.pauseCreditBehavior || "FROZEN",
          winbackDays: t.winbackDays ?? 0,
          winbackBonusCredits: t.winbackBonusCredits ?? 0,
          exitSurveyRequired: t.exitSurveyRequired ?? false,
          // JSON configs
          agentConfig: t.agentConfig ?? null,
          communityConfig: t.communityConfig ?? null,
          perksConfig: t.perksConfig ?? null,
        }),
      });
      if (res.ok) {
        await refreshTiers();
        toast.success("Plan duplicated");
      }
    },
    [refreshTiers]
  );

  const handleArchive = useCallback(
    async (tier: SubscriptionTier) => {
      const res = await fetch(`/api/tiers/${tier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED", isActive: false }),
      });
      if (res.ok) {
        await refreshTiers();
        toast.success("Plan archived");
      }
    },
    [refreshTiers]
  );

  const handleDelete = useCallback(
    async (tier: SubscriptionTier) => {
      if (!confirm(`Delete "${tier.name}"? This cannot be undone.`)) return;
      const res = await fetch(`/api/tiers/${tier.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshTiers();
        toast.success("Plan deleted");
      }
    },
    [refreshTiers]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.12))] -mb-6">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your subscription plans and their configuration.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-[#C5F135] text-black hover:bg-[#C5F135]/90"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Plan
        </Button>
      </div>

      {/* Tabs: List | Compare */}
      <Tabs defaultValue="list" className="w-full flex-1 flex flex-col min-h-0 mt-6">
        <TabsList className="shrink-0">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4 flex-1 min-h-0">
          <TierCarousel
            tiers={sortedTiers}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onEmpty={() => setShowCreate(true)}
          />
        </TabsContent>

        <TabsContent value="compare" className="mt-4">
          <TierComparison tiers={sortedTiers} settings={DEFAULT_SETTINGS} />
        </TabsContent>
      </Tabs>

      {/* Create sheet */}
      <TierCreateSheet
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={refreshTiers}
      />
    </div>
  );
}

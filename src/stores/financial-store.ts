import { create } from "zustand";
import type {
  FinancialInputs,
  ScenarioResults,
} from "@/lib/financial-engine";
import { calculateScenario } from "@/lib/financial-engine";

interface FinancialState {
  inputs: FinancialInputs;
  results: ScenarioResults | null;
  scenarioName: string;
  savedScenarios: { id: string; name: string; createdAt: string }[];

  setInputs: (inputs: Partial<FinancialInputs>) => void;
  setScenarioName: (name: string) => void;
  recalculate: () => void;
  setSavedScenarios: (
    scenarios: { id: string; name: string; createdAt: string }[]
  ) => void;
  loadInputs: (inputs: FinancialInputs, name: string) => void;
}

const DEFAULT_INPUTS: FinancialInputs = {
  tiers: [],
  billingCycleDistribution: { monthly: 60, biannual: 25, annual: 15 },
  creditRedemptionRate: 0.65,
  avgCOGSToMemberPriceRatio: 0.2,
  breakageRate: 0.35,
  fulfillmentCostPerOrder: 3.5,
  shippingCostPerOrder: 5.0,
  commissionStructure: {
    upfrontType: "flat",
    flatBonusPerSale: 50,
    // 15% of plan price is a sane starting point for "% of Plan" upfront.
    // The previous default of 100% silently turned commission into the full
    // plan price whenever the user toggled to percent mode without changing
    // the value — a CFO-grade footgun.
    upfrontPercent: 15,
    residualPercent: 5,
    residualDelayMonths: 0,
    tierBonuses: [],
    percentHittingAccelerator: 20,
    acceleratorMultiplier: 1.5,
    acceleratorThreshold: 1.5,
    clawbackWindowDays: 60,
    payoutDelayMonths: 0,
  },
  salesRepChannel: {
    startingReps: 10,
    salesPerRepPerMonth: 15,
    monthlyGrowthRate: 10,
  },
  samplerChannel: {
    monthlyMarketingSpend: 0,
    costPerSampler: 0,
    conversionRate: 0,
    monthlyGrowthRate: 0,
  },
  partnerKickbacks: [],
  // Default scenario seeds three structural overhead categories
  // (Marketing, Technology, Operations). Each starts with a single
  // milestone at 0 subscribers so they read as flat budgets until the
  // user adds further milestones (e.g. "at 1k subs Tech jumps to $12k").
  operationalOverhead: {
    mode: "categories",
    fixedMonthly: 25000, // legacy fallback
    categories: [
      {
        id: "cat-marketing",
        name: "Marketing",
        milestones: [{ memberCount: 0, monthlyCost: 8000 }],
      },
      {
        id: "cat-tech",
        name: "Technology",
        milestones: [{ memberCount: 0, monthlyCost: 6000 }],
      },
      {
        id: "cat-operations",
        name: "Operations",
        milestones: [{ memberCount: 0, monthlyCost: 11000 }],
      },
    ],
  },
  profitSplitParties: [],
  chargebackPercent: 0,
  chargebackFee: 15,
  // Buck platform fees — flat per-sub/mo + estimated AI token usage cost.
  buckPlatformFeePerSub: 5,
  buckTokenCostPerSub: 2,
  // Welcome Kit — one-time cost shipped to every new subscriber. Default
  // to 0 (the user has to set the actual cost; we don't presume).
  welcomeKitCostPerSub: 0,
};

export const useFinancialStore = create<FinancialState>((set, get) => ({
  inputs: DEFAULT_INPUTS,
  results: null,
  scenarioName: "",
  savedScenarios: [],

  setInputs: (partial) => {
    const newInputs = { ...get().inputs, ...partial };
    set({ inputs: newInputs, results: calculateScenario(newInputs) });
  },

  setScenarioName: (name) => set({ scenarioName: name }),

  recalculate: () => {
    set({ results: calculateScenario(get().inputs) });
  },

  setSavedScenarios: (scenarios) => set({ savedScenarios: scenarios }),

  loadInputs: (inputs, name) => {
    // Migrate old saved data that used salesTeam / totalSubscribers
    const migrated = { ...inputs } as FinancialInputs & Record<string, unknown>;
    if (!migrated.salesRepChannel && (migrated as Record<string, unknown>).salesTeam) {
      const old = (migrated as Record<string, unknown>).salesTeam as {
        activeReps?: number;
        newRepsPerMonth?: number;
        salesPerRepPerMonth?: number;
      };
      migrated.salesRepChannel = {
        startingReps: old.activeReps ?? 10,
        salesPerRepPerMonth: old.salesPerRepPerMonth ?? 15,
        monthlyGrowthRate: 10,
      };
      delete (migrated as Record<string, unknown>).salesTeam;
    }
    // Migrate legacy `quarterlyOverrides` → unified `override` with
    // frequency='quarterly'. Old shape allowed missing fields per
    // quarter (engine fell back to scalars); new shape requires both
    // fields per period, so we fill missing values from the scalar
    // defaults at migration time. This preserves the resolved value at
    // every month; the user can edit any period afterward.
    if (migrated.salesRepChannel) {
      const ch = migrated.salesRepChannel as typeof migrated.salesRepChannel & {
        quarterlyOverrides?: {
          quarter: number;
          monthlyGrowthRate?: number;
          salesPerRepPerMonth?: number;
        }[];
      };
      if (ch.quarterlyOverrides && ch.quarterlyOverrides.length > 0 && !ch.override) {
        ch.override = {
          frequency: "quarterly",
          periods: ch.quarterlyOverrides.map((o) => ({
            period: o.quarter,
            monthlyGrowthRate: o.monthlyGrowthRate ?? ch.monthlyGrowthRate,
            salesPerRepPerMonth: o.salesPerRepPerMonth ?? ch.salesPerRepPerMonth,
          })),
        };
      }
      delete ch.quarterlyOverrides;
    }
    if (!migrated.samplerChannel) {
      migrated.samplerChannel = {
        monthlyMarketingSpend: 5000,
        costPerSampler: 25,
        conversionRate: 15,
        monthlyGrowthRate: 10,
      };
    }
    // Remove old totalSubscribers if present
    delete (migrated as Record<string, unknown>).totalSubscribers;

    // Per-tier billingDistribution & creditRedemptionRate: optional fields added in
    // "Plan Assumptions" rework. Old snapshots simply lack these fields — the engine
    // falls back to global values via ?? operator. No migration needed.

    // Commission structure: new fields (upfrontType, upfrontPercent, payoutDelayMonths, residualDelayMonths)
    // Old snapshots lack these — engine uses ?? fallbacks ("flat", 0, 0, 0).
    if (migrated.commissionStructure && !migrated.commissionStructure.upfrontType) {
      migrated.commissionStructure = {
        ...migrated.commissionStructure,
        upfrontType: "flat" as const,
        upfrontPercent: 100,
        payoutDelayMonths: 0,
      };
    }
    if (migrated.commissionStructure && migrated.commissionStructure.residualDelayMonths == null) {
      migrated.commissionStructure = {
        ...migrated.commissionStructure,
        residualDelayMonths: 0,
      };
    }

    // Migrate old operationalOverheadMonthly → operationalOverhead
    if (!migrated.operationalOverhead && (migrated as Record<string, unknown>).operationalOverheadMonthly != null) {
      const oldOverhead = (migrated as Record<string, unknown>).operationalOverheadMonthly as number;
      migrated.operationalOverhead = { mode: "fixed", fixedMonthly: oldOverhead };
      delete (migrated as Record<string, unknown>).operationalOverheadMonthly;
    }
    if (!migrated.operationalOverhead) {
      migrated.operationalOverhead = { mode: "fixed", fixedMonthly: 25000 };
    }
    // Migrate "fixed" / "milestone-scaled" snapshots → "categories" mode.
    // We seed a single "Overhead" category at the legacy fixedMonthly so
    // the resolved total is preserved; the user can split it into named
    // buckets at their leisure.
    {
      const oh = migrated.operationalOverhead;
      if (oh && oh.mode !== "categories" && !oh.categories) {
        const seedMonthly =
          oh.mode === "milestone-scaled" && oh.opexData
            ? // sum the legacy first-milestone budgets to keep starting cost stable
              oh.opexData.reduce((sum, cat) => {
                if (!cat.isActive) return sum;
                return (
                  sum +
                  cat.items.reduce((s, item) => {
                    if (!item.isActive || item.milestones.length === 0) return s;
                    const lowest = [...item.milestones].sort(
                      (a, b) => a.memberCount - b.memberCount,
                    )[0];
                    return s + lowest.monthlyCost;
                  }, 0)
                );
              }, 0)
            : oh.fixedMonthly;
        oh.categories = [
          {
            id: "cat-overhead",
            name: "Overhead",
            milestones: [{ memberCount: 0, monthlyCost: seedMonthly }],
          },
        ];
        // Preserve legacy fields for round-trip; flip mode to categories.
        oh.mode = "categories";
      }
    }

    // Migrate old snapshots missing profitSplitParties
    if (!migrated.profitSplitParties) {
      migrated.profitSplitParties = [];
    }

    // Migrate old snapshots missing costAttribution → all-shared (S2). Empty
    // map ⇒ every rubric is shared (absence ⇒ "shared"), so the cascade
    // collapses to S1 behavior for legacy snapshots.
    if (!migrated.costAttribution) {
      migrated.costAttribution = {};
    }

    // Migrate old snapshots missing lossHandling → "absorbed" (S2.5 default B).
    // Safe to change the default now: no UI surfaces loss-month distribution yet.
    if (!migrated.lossHandling) {
      migrated.lossHandling = "absorbed";
    }

    // Migrate old snapshots missing leadershipCompPlan → disabled (S6). Absent
    // or enabled:false ⇒ cost 0 ⇒ identical behavior (the engine guards on
    // `enabled`); the default object just gives the store a defined shape.
    if (!migrated.leadershipCompPlan) {
      migrated.leadershipCompPlan = { enabled: false, base: "revenue", levels: [] };
    } else {
      // Migrate leadership levels across model versions, preserving each level's
      // effective rate:
      //   S8.2 (has baseRatePct) → pass through.
      //   S8.1 (dynamic qualifications, no base) → add a base tier; base mix 0
      //     when qualifications exist (keeps their weighting), 100 when empty.
      //   S6 legacy (bronze/prata tiers) → convert tiers to named qualifications
      //     (base inert: mix 0 keeps the original weighted rate).
      migrated.leadershipCompPlan = {
        ...migrated.leadershipCompPlan,
        levels: (migrated.leadershipCompPlan.levels ?? []).map((lvl) => {
          const raw = lvl as unknown as {
            id: string;
            name: string;
            span: number;
            baseRatePct?: number;
            baseMixPct?: number;
            qualifications?: { id: string; name: string; ratePct: number; mixPct: number }[];
            tiers?: { bronze: { ratePct: number }; prata: { ratePct: number } };
            tierMix?: { bronze: number; prata: number };
          };
          if (raw.baseRatePct !== undefined) return lvl;
          if (raw.qualifications) {
            return {
              id: raw.id,
              name: raw.name,
              span: raw.span,
              qualifications: raw.qualifications,
              baseRatePct: 0,
              baseMixPct: raw.qualifications.length > 0 ? 0 : 100,
            };
          }
          const qualifications =
            raw.tiers && raw.tierMix
              ? [
                  { id: crypto.randomUUID(), name: "Bronze", ratePct: raw.tiers.bronze.ratePct, mixPct: raw.tierMix.bronze },
                  { id: crypto.randomUUID(), name: "Prata", ratePct: raw.tiers.prata.ratePct, mixPct: raw.tierMix.prata },
                ]
              : [];
          return {
            id: raw.id,
            name: raw.name,
            span: raw.span,
            qualifications,
            baseRatePct: 0,
            baseMixPct: qualifications.length > 0 ? 0 : 100,
          };
        }),
      };
    }

    // Migrate old snapshots missing chargeback fields
    if (migrated.chargebackPercent == null) {
      migrated.chargebackPercent = 0;
    }
    if (migrated.chargebackFee == null) {
      migrated.chargebackFee = 15;
    }

    // Migrate old snapshots missing Buck platform fees.
    if (migrated.buckPlatformFeePerSub == null) {
      migrated.buckPlatformFeePerSub = 5;
    }
    if (migrated.buckTokenCostPerSub == null) {
      migrated.buckTokenCostPerSub = 2;
    }

    // Migrate old snapshots missing Welcome Kit cost (default to free).
    if (migrated.welcomeKitCostPerSub == null) {
      migrated.welcomeKitCostPerSub = 0;
    }

    // Migrate `quarterly` → `biannual` across BillingDistribution and per-tier
    // billing fields. Old snapshots (saved before the rename) have:
    //   billingCycleDistribution: { monthly, quarterly, annual }
    //   tier.quarterlyPricePerMonth
    //   tier.billingDistribution: { monthly, quarterly, annual }
    // The engine now expects `biannual`. Without this migration the engine
    // gets `undefined` for the biannual share and the projection NaNs out.
    const billing = migrated.billingCycleDistribution as
      | { monthly: number; quarterly?: number; biannual?: number; annual: number }
      | undefined;
    if (billing && billing.biannual == null && billing.quarterly != null) {
      migrated.billingCycleDistribution = {
        monthly: billing.monthly,
        biannual: billing.quarterly,
        annual: billing.annual,
      };
    }

    // Migrate tiers — minimumCommitMonths defaults + quarterly→biannual rename.
    if (migrated.tiers) {
      migrated.tiers = migrated.tiers.map((t) => {
        const tt = t as typeof t & {
          quarterlyPricePerMonth?: number;
          billingDistribution?: {
            monthly: number;
            quarterly?: number;
            biannual?: number;
            annual: number;
          };
        };
        const next: typeof t = {
          ...t,
          minimumCommitMonths: t.minimumCommitMonths ?? 1,
        };
        // Rename `quarterlyPricePerMonth` → `biannualPricePerMonth`.
        if (
          (next as typeof tt).biannualPricePerMonth == null &&
          tt.quarterlyPricePerMonth != null
        ) {
          (next as typeof tt).biannualPricePerMonth = tt.quarterlyPricePerMonth;
        }
        // Rename per-tier billingDistribution.quarterly → .biannual.
        if (
          tt.billingDistribution &&
          tt.billingDistribution.biannual == null &&
          tt.billingDistribution.quarterly != null
        ) {
          next.billingDistribution = {
            monthly: tt.billingDistribution.monthly,
            biannual: tt.billingDistribution.quarterly,
            annual: tt.billingDistribution.annual,
          };
        }
        // Per-tier commission structure: if a tier doesn't carry its own
        // structure, inherit the scenario-level default. This keeps old
        // saved snapshots correct after the move from global → per-tier.
        if ((next as typeof t & { commissionStructure?: unknown }).commissionStructure == null) {
          (next as typeof t & { commissionStructure?: unknown }).commissionStructure = {
            ...migrated.commissionStructure,
          };
        }
        // Migrate Path Scale add-on: legacy `mode: "sale"` (with
        // `payoutAmount` / `payoutMonth`) → new `mode: "purchase"`
        // (with `purchaseAmount`, paid at acquisition). The
        // `payoutMonth` field is dropped; purchase is always at Mo 1
        // since we pay the supplier on delivery, not later.
        const legacyAddOns = (t as typeof t & {
          addOns?: {
            pathScale?: {
              mode: "sale" | "purchase" | "lease";
              payoutAmount?: number;
              payoutMonth?: number;
              purchaseAmount?: number;
              monthlyFee?: number;
              leaseMonths?: number;
            };
          };
        }).addOns;
        if (legacyAddOns?.pathScale?.mode === ("sale" as string)) {
          const legacy = legacyAddOns.pathScale;
          next.addOns = {
            pathScale: {
              mode: "purchase",
              purchaseAmount: legacy.payoutAmount ?? legacy.purchaseAmount ?? 100,
            },
          };
        }
        return next;
      });
    }

    set({
      inputs: migrated,
      scenarioName: name,
      results: calculateScenario(migrated),
    });
  },
}));

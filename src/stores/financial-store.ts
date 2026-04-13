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
  billingCycleDistribution: { monthly: 60, quarterly: 25, annual: 15 },
  creditRedemptionRate: 0.65,
  avgCOGSToMemberPriceRatio: 0.2,
  breakageRate: 0.35,
  fulfillmentCostPerOrder: 3.5,
  shippingCostPerOrder: 5.0,
  commissionStructure: {
    upfrontType: "flat",
    flatBonusPerSale: 50,
    upfrontPercent: 100,
    residualPercent: 5,
    residualDelayMonths: 0,
    tierBonuses: [],
    percentHittingAccelerator: 20,
    acceleratorMultiplier: 1.5,
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
  operationalOverhead: { mode: "fixed", fixedMonthly: 25000 },
  profitSplitParties: [],
  chargebackPercent: 0,
  chargebackFee: 15,
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

    // Migrate old snapshots missing profitSplitParties
    if (!migrated.profitSplitParties) {
      migrated.profitSplitParties = [];
    }

    // Migrate old snapshots missing chargeback fields
    if (migrated.chargebackPercent == null) {
      migrated.chargebackPercent = 0;
    }
    if (migrated.chargebackFee == null) {
      migrated.chargebackFee = 15;
    }

    // Migrate tiers missing minimumCommitMonths
    if (migrated.tiers) {
      migrated.tiers = migrated.tiers.map((t) => ({
        ...t,
        minimumCommitMonths: t.minimumCommitMonths ?? 1,
      }));
    }

    set({
      inputs: migrated,
      scenarioName: name,
      results: calculateScenario(migrated),
    });
  },
}));

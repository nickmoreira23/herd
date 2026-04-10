"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────

export interface LocalProduct {
  productId: string;
  name: string;
  sku: string;
  category: string;
  subCategory: string | null;
  imageUrl: string | null;
  memberPrice: number;
  retailPrice: number;
  quantity: number;
  creditCost: number;
}

export interface TierInfo {
  id: string;
  name: string;
  slug: string;
  monthlyCredits: number;
  monthlyPrice: number;
  colorAccent: string;
  sortOrder: number;
}

export interface TierState {
  products: LocalProduct[];
  totalCreditsUsed: number;
  aiRun: boolean;
  aiLoading: boolean;
}

export type CreationPath = "manual" | "copilot" | "autonomous";

export interface AutonomousStatus {
  phase: "idle" | "creating" | "suggesting" | "saving" | "done" | "error";
  currentTier: string | null;
  completedTiers: string[];
  error: string | null;
}

export interface Preferences {
  supplements: number;
  apparel: number;
  accessories: number;
}

export interface AnalysisRecommendation {
  type: string;
  category: string;
  priority: string;
  budgetPercent: number;
  reasoning: string;
}

interface PackageWizardState {
  // Navigation
  currentStep: number;
  completedSteps: Set<number>;

  // Step 1 — Mode
  creationPath: CreationPath;

  // Step 2 — Goal
  fitnessGoal: string;
  customGoalDescription: string;

  // Step 3 — Preferences
  preferences: Preferences;

  // Step 4 — Analysis
  analysisRecommendations: AnalysisRecommendation[];
  aiAnalysisRun: boolean;

  // Step 6 — Identity
  name: string;
  description: string;
  imageUrl: string | null;

  // Package created after Step 2 → 3 transition
  packageId: string | null;
  tiers: TierInfo[];
  activeTierId: string | null;

  // Step 5 — local product state per tier
  tierProducts: Record<string, TierState>;

  // Autonomous mode tracking
  autonomousStatus: AutonomousStatus | null;

  // Submission
  isSubmitting: boolean;

  // Actions
  setStep: (step: number) => void;
  markStepComplete: (step: number) => void;
  setFitnessGoal: (goal: string) => void;
  setCustomGoalDescription: (desc: string) => void;
  setCreationPath: (path: CreationPath) => void;
  setPreferences: (prefs: Preferences) => void;
  setAnalysisRecommendations: (recs: AnalysisRecommendation[]) => void;
  setAiAnalysisRun: (v: boolean) => void;
  setName: (name: string) => void;
  setDescription: (desc: string) => void;
  setImageUrl: (url: string | null) => void;
  setPackageCreated: (id: string, tiers: TierInfo[]) => void;
  setActiveTier: (tierId: string) => void;
  addProduct: (tierId: string, product: LocalProduct) => void;
  removeProduct: (tierId: string, productId: string) => void;
  updateQuantity: (tierId: string, productId: string, quantity: number) => void;
  setTierProducts: (tierId: string, products: LocalProduct[]) => void;
  markAiRun: (tierId: string) => void;
  setTierAiLoading: (tierId: string, loading: boolean) => void;
  copyFromTier: (sourceTierId: string, targetTierId: string) => void;
  setAutonomousStatus: (status: AutonomousStatus | null) => void;
  setIsSubmitting: (v: boolean) => void;
  reset: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────

function calcTotal(products: LocalProduct[]): number {
  return products.reduce((sum, p) => sum + p.creditCost * p.quantity, 0);
}

function ensureTierState(state: Record<string, TierState>, tierId: string): TierState {
  return state[tierId] ?? { products: [], totalCreditsUsed: 0, aiRun: false, aiLoading: false };
}

// ─── Store ────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: Preferences = {
  supplements: 60,
  apparel: 25,
  accessories: 15,
};

const INITIAL_STATE = {
  currentStep: 1,
  completedSteps: new Set<number>(),
  fitnessGoal: "",
  customGoalDescription: "",
  creationPath: "copilot" as CreationPath,
  preferences: { ...DEFAULT_PREFERENCES },
  analysisRecommendations: [] as AnalysisRecommendation[],
  aiAnalysisRun: false,
  name: "",
  description: "",
  imageUrl: null as string | null,
  packageId: null as string | null,
  tiers: [] as TierInfo[],
  activeTierId: null as string | null,
  tierProducts: {} as Record<string, TierState>,
  autonomousStatus: null as AutonomousStatus | null,
  isSubmitting: false,
};

export const usePackageWizardStore = create<PackageWizardState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setStep: (step) => set({ currentStep: step }),

      markStepComplete: (step) =>
        set((s) => ({
          completedSteps: new Set([...s.completedSteps, step]),
        })),

      setFitnessGoal: (fitnessGoal) => set({ fitnessGoal }),
      setCustomGoalDescription: (customGoalDescription) => set({ customGoalDescription }),
      setCreationPath: (creationPath) => set({ creationPath }),
      setPreferences: (preferences) => set({ preferences }),
      setAnalysisRecommendations: (analysisRecommendations) => set({ analysisRecommendations }),
      setAiAnalysisRun: (aiAnalysisRun) => set({ aiAnalysisRun }),
      setName: (name) => set({ name }),
      setDescription: (description) => set({ description }),
      setImageUrl: (imageUrl) => set({ imageUrl }),

      setPackageCreated: (id, tiers) => {
        const tierProducts: Record<string, TierState> = {};
        for (const tier of tiers) {
          tierProducts[tier.id] = { products: [], totalCreditsUsed: 0, aiRun: false, aiLoading: false };
        }
        set({
          packageId: id,
          tiers,
          activeTierId: tiers[0]?.id ?? null,
          tierProducts,
        });
      },

      setActiveTier: (tierId) => set({ activeTierId: tierId }),

      addProduct: (tierId, product) =>
        set((s) => {
          const tier = ensureTierState(s.tierProducts, tierId);
          if (tier.products.some((p) => p.productId === product.productId)) return s;
          const products = [...tier.products, product];
          return {
            tierProducts: {
              ...s.tierProducts,
              [tierId]: { ...tier, products, totalCreditsUsed: calcTotal(products) },
            },
          };
        }),

      removeProduct: (tierId, productId) =>
        set((s) => {
          const tier = ensureTierState(s.tierProducts, tierId);
          const products = tier.products.filter((p) => p.productId !== productId);
          return {
            tierProducts: {
              ...s.tierProducts,
              [tierId]: { ...tier, products, totalCreditsUsed: calcTotal(products) },
            },
          };
        }),

      updateQuantity: (tierId, productId, quantity) =>
        set((s) => {
          const tier = ensureTierState(s.tierProducts, tierId);
          const products = tier.products.map((p) =>
            p.productId === productId ? { ...p, quantity: Math.max(1, quantity) } : p
          );
          return {
            tierProducts: {
              ...s.tierProducts,
              [tierId]: { ...tier, products, totalCreditsUsed: calcTotal(products) },
            },
          };
        }),

      setTierProducts: (tierId, products) =>
        set((s) => {
          const tier = ensureTierState(s.tierProducts, tierId);
          return {
            tierProducts: {
              ...s.tierProducts,
              [tierId]: { ...tier, products, totalCreditsUsed: calcTotal(products) },
            },
          };
        }),

      markAiRun: (tierId) =>
        set((s) => {
          const tier = ensureTierState(s.tierProducts, tierId);
          return {
            tierProducts: {
              ...s.tierProducts,
              [tierId]: { ...tier, aiRun: true, aiLoading: false },
            },
          };
        }),

      setTierAiLoading: (tierId, loading) =>
        set((s) => {
          const tier = ensureTierState(s.tierProducts, tierId);
          return {
            tierProducts: {
              ...s.tierProducts,
              [tierId]: { ...tier, aiLoading: loading },
            },
          };
        }),

      copyFromTier: (sourceTierId, targetTierId) =>
        set((s) => {
          const source = ensureTierState(s.tierProducts, sourceTierId);
          const target = ensureTierState(s.tierProducts, targetTierId);
          const copiedProducts = source.products.map((p) => ({ ...p }));
          const existingIds = new Set(target.products.map((p) => p.productId));
          const merged = [
            ...target.products,
            ...copiedProducts.filter((p) => !existingIds.has(p.productId)),
          ];
          return {
            tierProducts: {
              ...s.tierProducts,
              [targetTierId]: { ...target, products: merged, totalCreditsUsed: calcTotal(merged) },
            },
          };
        }),

      setAutonomousStatus: (autonomousStatus) => set({ autonomousStatus }),

      setIsSubmitting: (v) => set({ isSubmitting: v }),

      reset: () =>
        set({
          ...INITIAL_STATE,
          completedSteps: new Set<number>(),
          preferences: { ...DEFAULT_PREFERENCES },
          analysisRecommendations: [],
          tierProducts: {},
        }),
    }),
    {
      name: "package-wizard",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: [...state.completedSteps],
        creationPath: state.creationPath,
        fitnessGoal: state.fitnessGoal,
        customGoalDescription: state.customGoalDescription,
        preferences: state.preferences,
        analysisRecommendations: state.analysisRecommendations,
        aiAnalysisRun: state.aiAnalysisRun,
        name: state.name,
        description: state.description,
        imageUrl: state.imageUrl,
        packageId: state.packageId,
        tiers: state.tiers,
        activeTierId: state.activeTierId,
        tierProducts: state.tierProducts,
        autonomousStatus: state.autonomousStatus,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PackageWizardState>;
        return {
          ...currentState,
          ...persisted,
          completedSteps: new Set(
            (persisted.completedSteps as unknown as number[]) || []
          ),
        };
      },
    }
  )
);

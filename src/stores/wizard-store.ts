"use client";

import { create } from "zustand";
import type { CreateNetworkProfileInput } from "@/lib/validators/network-profile";

type NetworkType = "INTERNAL" | "EXTERNAL";

export interface ProfileTypeConfig {
  id: string;
  slug: string;
  displayName: string;
  networkType: NetworkType;
  wizardFields: unknown[];
  defaultRoleIds: string[];
  defaultCompPlanId?: string | null;
  defaultRankId?: string | null;
}

interface WizardState {
  currentStep: number;
  completedSteps: Set<number>;
  formData: Partial<CreateNetworkProfileInput>;
  profileTypeConfig: ProfileTypeConfig | null;
  isSubmitting: boolean;

  setStep: (step: number) => void;
  setIsSubmitting: (v: boolean) => void;
  updateFormData: (data: Partial<CreateNetworkProfileInput>) => void;
  setProfileTypeConfig: (pt: ProfileTypeConfig) => void;
  markStepComplete: (step: number) => void;
  reset: () => void;

  // Computed
  effectiveSteps: (networkType?: NetworkType) => number[];
  totalSteps: (networkType?: NetworkType) => number;
}

const INITIAL_STATE = {
  currentStep: 1,
  completedSteps: new Set<number>(),
  formData: {} as Partial<CreateNetworkProfileInput>,
  profileTypeConfig: null,
  isSubmitting: false,
};

export const useWizardStore = create<WizardState>((set, get) => ({
  ...INITIAL_STATE,

  setStep: (step) => set({ currentStep: step }),

  setIsSubmitting: (v) => set({ isSubmitting: v }),

  updateFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  setProfileTypeConfig: (pt) =>
    set((state) => ({
      profileTypeConfig: pt,
      formData: { ...state.formData, roleIds: pt.defaultRoleIds },
    })),

  markStepComplete: (step) =>
    set((state) => ({
      completedSteps: new Set([...state.completedSteps, step]),
    })),

  reset: () =>
    set({
      ...INITIAL_STATE,
      completedSteps: new Set<number>(),
    }),

  effectiveSteps: (networkType) => {
    const nt = networkType ?? get().formData.networkType;
    // Step 5 (compensation) only shown for EXTERNAL profiles
    if (nt === "EXTERNAL") return [1, 2, 3, 4, 5, 6, 7];
    return [1, 2, 3, 4, 6, 7];
  },

  totalSteps: (networkType) => {
    const nt = networkType ?? get().formData.networkType;
    return nt === "EXTERNAL" ? 7 : 6;
  },
}));

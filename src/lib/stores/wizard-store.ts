"use client"

import { create } from "zustand"
import type { CreateProfileInput } from "@/lib/validations/network"
type NetworkType = "INTERNAL" | "EXTERNAL"

export interface ProfileTypeConfig {
  id: string
  slug: string
  displayName: string
  networkType: NetworkType
  wizardFields: unknown[]
  defaultRoleIds: string[]
  defaultCompPlanId?: string | null
  defaultRankId?: string | null
}

interface WizardState {
  currentStep: number
  completedSteps: Set<number>
  formData: Partial<CreateProfileInput>
  profileTypeConfig: ProfileTypeConfig | null
  isSubmitting: boolean

  setStep: (step: number) => void
  updateFormData: (data: Partial<CreateProfileInput>) => void
  setProfileTypeConfig: (pt: ProfileTypeConfig) => void
  markStepComplete: (step: number) => void
  reset: () => void

  // Computed
  effectiveSteps: (networkType?: NetworkType) => number[]
  totalSteps: (networkType?: NetworkType) => number
}

const INITIAL_STATE = {
  currentStep: 1,
  completedSteps: new Set<number>(),
  formData: {} as Partial<CreateProfileInput>,
  profileTypeConfig: null,
  isSubmitting: false,
}

export const useWizardStore = create<WizardState>((set, get) => ({
  ...INITIAL_STATE,

  setStep: (step) => set({ currentStep: step }),

  updateFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  setProfileTypeConfig: (pt) =>
    set((state) => ({
      profileTypeConfig: pt,
      // Pre-fill default roles from type config
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
    const nt = networkType ?? get().formData.networkType
    // Step 5 (compensation) only shown for EXTERNAL profiles
    if (nt === "EXTERNAL") return [1, 2, 3, 4, 5, 6, 7]
    return [1, 2, 3, 4, 6, 7]
  },

  totalSteps: (networkType) => {
    const nt = networkType ?? get().formData.networkType
    return nt === "EXTERNAL" ? 7 : 6
  },
}))

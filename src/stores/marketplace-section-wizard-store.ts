"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ComponentNode } from "@/types/landing-page";
import type { MemberRole } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────

export type CreationPath = "manual" | "copilot" | "autonomous";

// L2b.2 — ITEM kept in the union for back-compat of any persisted draft, but the
// wizard no longer creates ITEM scopes: "specific item" is now a curated Listing.
export type ScopeType = "ALL" | "CATEGORY" | "SUB_CATEGORY" | "ITEM";

/** L2b.2 — a curated item draft (becomes a Listing on save). */
export interface SectionListingDraft {
  clientId: string;
  blockName: string;
  /** Raw block record id (sourceId). */
  sourceId: string;
}

export interface SectionScopeDraft {
  /** Stable client-side id used while the draft hasn't been persisted. */
  clientId: string;
  /** Persisted id once the scope is saved. */
  id?: string;
  blockName: string;
  scopeType: ScopeType;
  /** null when scopeType=ALL */
  scopeValue: string | null;
  sortOrder: number;
  /** SE5a — internal visibility roles. Empty = unrestricted (any logged member). */
  allowedRoles: MemberRole[];
}

/** Snapshot of an item used by the picker (so we can show name/image even
 *  before the section is persisted). */
export interface ItemSnapshot {
  /** "type:uuid" — same shape as DataProvider returns. */
  fullId: string;
  /** Raw block uuid (no type prefix). */
  rawId: string;
  blockName: string;
  type: string;
  name: string;
  imageUrl: string | null;
  category: string | null;
  subCategory: string | null;
}

interface MarketplaceWizardState {
  // Navigation
  currentStep: number;
  completedSteps: Set<number>;

  // Step 1 — Mode
  creationPath: CreationPath;

  // Step 2 — Block
  selectedBlockNames: string[];

  // Step 3 — Items (automatic scopes + curated listings per block)
  scopes: SectionScopeDraft[];
  /** L2b.2 — curated items (become Listings on save). */
  listings: SectionListingDraft[];
  /** Per-block snapshot cache so the picker can render names/images. */
  itemSnapshots: Record<string, ItemSnapshot>; // key = fullId

  // Step 4 — Section composer
  components: ComponentNode[];
  layout: Record<string, unknown> | null;
  selectedComponentId: string | null;

  // Step 5 — Identity
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  iconKey: string | null;

  // Persistence
  sectionId: string | null;
  isSubmitting: boolean;

  // Actions
  setStep: (step: number) => void;
  markStepComplete: (step: number) => void;

  setCreationPath: (path: CreationPath) => void;
  toggleBlock: (blockName: string) => void;
  setSelectedBlocks: (names: string[]) => void;

  addScope: (scope: SectionScopeDraft) => void;
  updateScope: (clientId: string, patch: Partial<SectionScopeDraft>) => void;
  removeScope: (clientId: string) => void;
  addListing: (listing: SectionListingDraft) => void;
  removeListing: (clientId: string) => void;
  cacheItemSnapshot: (snap: ItemSnapshot) => void;

  setComponents: (components: ComponentNode[]) => void;
  addComponent: (node: ComponentNode, index?: number) => void;
  updateComponentProps: (id: string, props: Record<string, unknown>) => void;
  removeComponent: (id: string) => void;
  moveComponent: (fromIndex: number, toIndex: number) => void;
  duplicateComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  setLayout: (layout: Record<string, unknown> | null) => void;

  setName: (v: string) => void;
  setSlug: (v: string) => void;
  setDescription: (v: string) => void;
  setImageUrl: (v: string | null) => void;
  setIconKey: (v: string | null) => void;

  setSectionId: (id: string | null) => void;
  setIsSubmitting: (v: boolean) => void;

  reset: () => void;
}

// ─── Initial state ────────────────────────────────────────

const INITIAL_STATE = {
  currentStep: 1,
  completedSteps: new Set<number>(),
  creationPath: "copilot" as CreationPath,
  selectedBlockNames: [] as string[],
  scopes: [] as SectionScopeDraft[],
  listings: [] as SectionListingDraft[],
  itemSnapshots: {} as Record<string, ItemSnapshot>,
  components: [] as ComponentNode[],
  layout: null as Record<string, unknown> | null,
  selectedComponentId: null as string | null,
  name: "",
  slug: "",
  description: "",
  imageUrl: null as string | null,
  iconKey: null as string | null,
  sectionId: null as string | null,
  isSubmitting: false,
};

// ─── Store ────────────────────────────────────────────────

export const useMarketplaceWizardStore = create<MarketplaceWizardState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setStep: (step) => set({ currentStep: step }),

      markStepComplete: (step) =>
        set((s) => ({
          completedSteps: new Set([...s.completedSteps, step]),
        })),

      setCreationPath: (creationPath) => set({ creationPath }),

      toggleBlock: (blockName) =>
        set((s) => ({
          selectedBlockNames: s.selectedBlockNames.includes(blockName)
            ? s.selectedBlockNames.filter((n) => n !== blockName)
            : [...s.selectedBlockNames, blockName],
          // Drop scopes + listings that belong to the removed block.
          scopes: s.selectedBlockNames.includes(blockName)
            ? s.scopes.filter((sc) => sc.blockName !== blockName)
            : s.scopes,
          listings: s.selectedBlockNames.includes(blockName)
            ? s.listings.filter((l) => l.blockName !== blockName)
            : s.listings,
        })),

      setSelectedBlocks: (selectedBlockNames) =>
        set((s) => ({
          selectedBlockNames,
          scopes: s.scopes.filter((sc) => selectedBlockNames.includes(sc.blockName)),
          listings: s.listings.filter((l) => selectedBlockNames.includes(l.blockName)),
        })),

      addScope: (scope) => set((s) => ({ scopes: [...s.scopes, scope] })),

      updateScope: (clientId, patch) =>
        set((s) => ({
          scopes: s.scopes.map((sc) =>
            sc.clientId === clientId ? { ...sc, ...patch } : sc
          ),
        })),

      removeScope: (clientId) =>
        set((s) => ({ scopes: s.scopes.filter((sc) => sc.clientId !== clientId) })),

      addListing: (listing) => set((s) => ({ listings: [...s.listings, listing] })),

      removeListing: (clientId) =>
        set((s) => ({ listings: s.listings.filter((l) => l.clientId !== clientId) })),

      cacheItemSnapshot: (snap) =>
        set((s) => ({ itemSnapshots: { ...s.itemSnapshots, [snap.fullId]: snap } })),

      setComponents: (components) => set({ components }),

      addComponent: (node, index) =>
        set((s) => {
          const list = [...s.components];
          if (index === undefined || index >= list.length) list.push(node);
          else list.splice(index, 0, node);
          return { components: list, selectedComponentId: node.id };
        }),

      updateComponentProps: (id, props) =>
        set((s) => ({
          components: s.components.map((c) =>
            c.id === id ? { ...c, props: { ...c.props, ...props } } : c
          ),
        })),

      removeComponent: (id) =>
        set((s) => ({
          components: s.components.filter((c) => c.id !== id),
          selectedComponentId:
            s.selectedComponentId === id ? null : s.selectedComponentId,
        })),

      moveComponent: (fromIndex, toIndex) =>
        set((s) => {
          if (fromIndex === toIndex) return {};
          const list = [...s.components];
          const [item] = list.splice(fromIndex, 1);
          list.splice(toIndex, 0, item);
          return { components: list };
        }),

      duplicateComponent: (id) =>
        set((s) => {
          const idx = s.components.findIndex((c) => c.id === id);
          if (idx === -1) return {};
          const original = s.components[idx];
          const copy: ComponentNode = {
            ...original,
            id: crypto.randomUUID(),
            props: { ...original.props },
            styles: { ...original.styles },
          };
          const list = [...s.components];
          list.splice(idx + 1, 0, copy);
          return { components: list, selectedComponentId: copy.id };
        }),

      selectComponent: (selectedComponentId) => set({ selectedComponentId }),

      setLayout: (layout) => set({ layout }),

      setName: (name) => set({ name }),
      setSlug: (slug) => set({ slug }),
      setDescription: (description) => set({ description }),
      setImageUrl: (imageUrl) => set({ imageUrl }),
      setIconKey: (iconKey) => set({ iconKey }),

      setSectionId: (sectionId) => set({ sectionId }),
      setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

      reset: () =>
        set({
          ...INITIAL_STATE,
          completedSteps: new Set<number>(),
          scopes: [],
          listings: [],
          itemSnapshots: {},
          components: [],
          selectedBlockNames: [],
        }),
    }),
    {
      name: "marketplace-section-wizard",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: [...state.completedSteps],
        creationPath: state.creationPath,
        selectedBlockNames: state.selectedBlockNames,
        scopes: state.scopes,
        listings: state.listings,
        itemSnapshots: state.itemSnapshots,
        components: state.components,
        layout: state.layout,
        name: state.name,
        slug: state.slug,
        description: state.description,
        imageUrl: state.imageUrl,
        iconKey: state.iconKey,
        sectionId: state.sectionId,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<MarketplaceWizardState>;
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

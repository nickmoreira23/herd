import { create } from "zustand";
import type {
  LandingPageData,
  SectionData,
  PageStyles,
  SectionLayout,
  ComponentNode,
  ComponentStyles,
} from "@/types/landing-page";
import { DEFAULT_PAGE_STYLES, DEFAULT_SECTION_LAYOUT, DEFAULT_COMPONENT_STYLES } from "@/lib/landing-page/defaults";

// ─── History ────────────────────────────────────────────────────────

interface HistoryEntry {
  sections: SectionData[];
  pageStyles: PageStyles;
}

const MAX_HISTORY = 50;

// ─── Debounced history for high-frequency updates (typing, sliders) ─
let _historyTimeout: ReturnType<typeof setTimeout> | null = null;
let _historySnapshotPending = false;
let _batching = false;

// ─── State ──────────────────────────────────────────────────────────

interface EditorState {
  // Page data
  page: LandingPageData | null;
  sections: SectionData[];
  pageStyles: PageStyles;
  isDirty: boolean;
  isSaving: boolean;

  // Selection
  selectedSectionId: string | null;
  selectedComponentId: string | null;

  // UI state
  leftPanel: "add" | "layers" | "settings";
  rightPanelOpen: boolean;
  previewMode: "desktop" | "tablet" | "mobile";
  canvasZoom: number;
  isPreviewFullscreen: boolean;

  // History
  history: HistoryEntry[];
  future: HistoryEntry[];

  // ─── Actions: Page ──────────────────────────────────────────────

  loadPage: (page: LandingPageData, sections: SectionData[]) => void;
  updatePage: (data: Partial<LandingPageData>) => void;
  updatePageStyles: (styles: Partial<PageStyles>) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;

  // ─── Actions: Sections ──────────────────────────────────────────

  addSection: (sectionType: string, index?: number) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  updateSectionLayout: (sectionId: string, layout: Partial<SectionLayout>) => void;
  updateSectionName: (sectionId: string, name: string) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  toggleSectionLock: (sectionId: string) => void;
  duplicateSection: (sectionId: string) => void;
  setSections: (sections: SectionData[]) => void;

  // ─── Actions: Components ────────────────────────────────────────

  addComponent: (sectionId: string, component: ComponentNode, index?: number) => void;
  removeComponent: (sectionId: string, componentId: string) => void;
  updateComponentProps: (sectionId: string, componentId: string, props: Record<string, unknown>) => void;
  updateComponentStyles: (sectionId: string, componentId: string, styles: Partial<ComponentStyles>) => void;
  reorderComponents: (sectionId: string, fromIndex: number, toIndex: number) => void;
  duplicateComponent: (sectionId: string, componentId: string) => void;

  // ─── Actions: Selection ─────────────────────────────────────────

  selectSection: (sectionId: string | null) => void;
  selectComponent: (sectionId: string, componentId: string) => void;
  clearSelection: () => void;

  // ─── Actions: History ───────────────────────────────────────────

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  pushHistoryDebounced: () => void;
  batchStart: () => void;
  batchEnd: () => void;

  // ─── Actions: UI ────────────────────────────────────────────────

  setLeftPanel: (panel: "add" | "layers" | "settings") => void;
  setRightPanelOpen: (open: boolean) => void;
  setPreviewMode: (mode: "desktop" | "tablet" | "mobile") => void;
  setCanvasZoom: (zoom: number) => void;
  setPreviewFullscreen: (fullscreen: boolean) => void;

  // ─── Computed ───────────────────────────────────────────────────

  getSelectedSection: () => SectionData | undefined;
  getSelectedComponent: () => ComponentNode | undefined;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

function mapSections(
  sections: SectionData[],
  sectionId: string,
  fn: (section: SectionData) => SectionData
): SectionData[] {
  return sections.map((s) => (s.id === sectionId ? fn(s) : s));
}

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

// ─── Store ──────────────────────────────────────────────────────────

export const useLandingPageEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  page: null,
  sections: [],
  pageStyles: DEFAULT_PAGE_STYLES,
  isDirty: false,
  isSaving: false,
  selectedSectionId: null,
  selectedComponentId: null,
  leftPanel: "add",
  rightPanelOpen: true,
  previewMode: "desktop",
  canvasZoom: 1,
  isPreviewFullscreen: false,
  history: [],
  future: [],

  // ─── Page ─────────────────────────────────────────────────────

  loadPage: (page, sections) => {
    const pageStyles = (page.pageStyles && typeof page.pageStyles === "object" && "fonts" in page.pageStyles)
      ? page.pageStyles as PageStyles
      : DEFAULT_PAGE_STYLES;
    set({
      page,
      sections: sections.sort((a, b) => a.sortOrder - b.sortOrder),
      pageStyles,
      isDirty: false,
      isSaving: false,
      selectedSectionId: null,
      selectedComponentId: null,
      history: [],
      future: [],
    });
  },

  updatePage: (data) => {
    set((s) => ({
      page: s.page ? { ...s.page, ...data } : s.page,
    }));
  },

  updatePageStyles: (styles) => {
    get().pushHistory();
    set((s) => ({
      pageStyles: { ...s.pageStyles, ...styles },
      isDirty: true,
    }));
  },

  setDirty: (dirty) => set({ isDirty: dirty }),
  setSaving: (saving) => set({ isSaving: saving }),

  // ─── Sections ─────────────────────────────────────────────────

  addSection: (sectionType, index) => {
    get().pushHistory();
    const sections = get().sections;
    const insertIndex = index ?? sections.length;
    const newSection: SectionData = {
      id: generateId(),
      pageId: get().page?.id ?? "",
      sectionType,
      name: null,
      layout: { ...DEFAULT_SECTION_LAYOUT },
      components: [],
      isVisible: true,
      isLocked: false,
      sortOrder: insertIndex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...sections];
    updated.splice(insertIndex, 0, newSection);
    // Re-index sortOrder
    const reindexed = updated.map((s, i) => ({ ...s, sortOrder: i }));
    set({ sections: reindexed, isDirty: true, selectedSectionId: newSection.id, selectedComponentId: null });
  },

  removeSection: (sectionId) => {
    get().pushHistory();
    set((s) => {
      const filtered = s.sections.filter((sec) => sec.id !== sectionId);
      const reindexed = filtered.map((sec, i) => ({ ...sec, sortOrder: i }));
      return {
        sections: reindexed,
        isDirty: true,
        selectedSectionId: s.selectedSectionId === sectionId ? null : s.selectedSectionId,
        selectedComponentId: s.selectedSectionId === sectionId ? null : s.selectedComponentId,
      };
    });
  },

  reorderSections: (fromIndex, toIndex) => {
    get().pushHistory();
    set((s) => {
      const moved = arrayMove(s.sections, fromIndex, toIndex);
      const reindexed = moved.map((sec, i) => ({ ...sec, sortOrder: i }));
      return { sections: reindexed, isDirty: true };
    });
  },

  updateSectionLayout: (sectionId, layout) => {
    get().pushHistory();
    set((s) => ({
      sections: mapSections(s.sections, sectionId, (sec) => ({
        ...sec,
        layout: { ...sec.layout, ...layout },
      })),
      isDirty: true,
    }));
  },

  updateSectionName: (sectionId, name) => {
    set((s) => ({
      sections: mapSections(s.sections, sectionId, (sec) => ({ ...sec, name })),
      isDirty: true,
    }));
  },

  toggleSectionVisibility: (sectionId) => {
    set((s) => ({
      sections: mapSections(s.sections, sectionId, (sec) => ({
        ...sec,
        isVisible: !sec.isVisible,
      })),
      isDirty: true,
    }));
  },

  toggleSectionLock: (sectionId) => {
    set((s) => ({
      sections: mapSections(s.sections, sectionId, (sec) => ({
        ...sec,
        isLocked: !sec.isLocked,
      })),
      isDirty: true,
    }));
  },

  duplicateSection: (sectionId) => {
    get().pushHistory();
    set((s) => {
      const idx = s.sections.findIndex((sec) => sec.id === sectionId);
      if (idx === -1) return s;
      const original = s.sections[idx];
      const duplicate: SectionData = {
        ...original,
        id: generateId(),
        name: original.name ? `${original.name} (copy)` : null,
        components: original.components.map((c) => ({ ...c, id: generateId() })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...s.sections];
      updated.splice(idx + 1, 0, duplicate);
      const reindexed = updated.map((sec, i) => ({ ...sec, sortOrder: i }));
      return { sections: reindexed, isDirty: true };
    });
  },

  setSections: (sections) => set({ sections }),

  // ─── Components ───────────────────────────────────────────────

  addComponent: (sectionId, component, index) => {
    get().pushHistory();
    set((s) => ({
      sections: mapSections(s.sections, sectionId, (sec) => {
        const comps = [...sec.components];
        const insertIdx = index ?? comps.length;
        comps.splice(insertIdx, 0, component);
        return { ...sec, components: comps };
      }),
      isDirty: true,
      selectedSectionId: sectionId,
      selectedComponentId: component.id,
    }));
  },

  removeComponent: (sectionId, componentId) => {
    get().pushHistory();
    set((s) => ({
      sections: mapSections(s.sections, sectionId, (sec) => ({
        ...sec,
        components: sec.components.filter((c) => c.id !== componentId),
      })),
      isDirty: true,
      selectedComponentId: s.selectedComponentId === componentId ? null : s.selectedComponentId,
    }));
  },

  updateComponentProps: (sectionId, componentId, props) => {
    get().pushHistoryDebounced();
    set((s) => ({
      sections: mapSections(s.sections, sectionId, (sec) => ({
        ...sec,
        components: sec.components.map((c) =>
          c.id === componentId ? { ...c, props: { ...c.props, ...props } } : c
        ),
      })),
      isDirty: true,
    }));
  },

  updateComponentStyles: (sectionId, componentId, styles) => {
    get().pushHistoryDebounced();
    set((s) => ({
      sections: mapSections(s.sections, sectionId, (sec) => ({
        ...sec,
        components: sec.components.map((c) =>
          c.id === componentId ? { ...c, styles: { ...c.styles, ...styles } } : c
        ),
      })),
      isDirty: true,
    }));
  },

  reorderComponents: (sectionId, fromIndex, toIndex) => {
    get().pushHistory();
    set((s) => ({
      sections: mapSections(s.sections, sectionId, (sec) => ({
        ...sec,
        components: arrayMove(sec.components, fromIndex, toIndex),
      })),
      isDirty: true,
    }));
  },

  duplicateComponent: (sectionId, componentId) => {
    get().pushHistory();
    set((s) => ({
      sections: mapSections(s.sections, sectionId, (sec) => {
        const idx = sec.components.findIndex((c) => c.id === componentId);
        if (idx === -1) return sec;
        const original = sec.components[idx];
        const duplicate: ComponentNode = {
          ...original,
          id: generateId(),
          children: original.children?.map((child) => ({ ...child, id: generateId() })),
        };
        const comps = [...sec.components];
        comps.splice(idx + 1, 0, duplicate);
        return { ...sec, components: comps };
      }),
      isDirty: true,
    }));
  },

  // ─── Selection ────────────────────────────────────────────────

  selectSection: (sectionId) => set({ selectedSectionId: sectionId, selectedComponentId: null }),

  selectComponent: (sectionId, componentId) =>
    set({ selectedSectionId: sectionId, selectedComponentId: componentId }),

  clearSelection: () => set({ selectedSectionId: null, selectedComponentId: null }),

  // ─── History ──────────────────────────────────────────────────

  pushHistory: () => {
    if (_batching) return;
    const { sections, pageStyles, history } = get();
    const entry: HistoryEntry = {
      sections: JSON.parse(JSON.stringify(sections)),
      pageStyles: JSON.parse(JSON.stringify(pageStyles)),
    };
    set({
      history: [...history, entry].slice(-MAX_HISTORY),
      future: [], // clear redo stack on new action
    });
  },

  pushHistoryDebounced: () => {
    if (_batching) return;
    // Snapshot state BEFORE the first change in a burst, then commit after 300ms idle
    if (!_historySnapshotPending) {
      _historySnapshotPending = true;
      get().pushHistory();
    }
    if (_historyTimeout) clearTimeout(_historyTimeout);
    _historyTimeout = setTimeout(() => {
      _historySnapshotPending = false;
      _historyTimeout = null;
    }, 300);
  },

  batchStart: () => {
    if (!_batching) {
      get().pushHistory();
      _batching = true;
    }
  },

  batchEnd: () => {
    _batching = false;
  },

  undo: () => {
    const { sections, pageStyles, history, future } = get();
    if (history.length === 0) return;
    // Save current state to future (for redo)
    const currentEntry: HistoryEntry = {
      sections: JSON.parse(JSON.stringify(sections)),
      pageStyles: JSON.parse(JSON.stringify(pageStyles)),
    };
    const prev = history[history.length - 1];
    set({
      sections: prev.sections,
      pageStyles: prev.pageStyles,
      history: history.slice(0, -1),
      future: [currentEntry, ...future],
      isDirty: true,
    });
  },

  redo: () => {
    const { sections, pageStyles, history, future } = get();
    if (future.length === 0) return;
    // Save current state to history (for undo)
    const currentEntry: HistoryEntry = {
      sections: JSON.parse(JSON.stringify(sections)),
      pageStyles: JSON.parse(JSON.stringify(pageStyles)),
    };
    const next = future[0];
    set({
      sections: next.sections,
      pageStyles: next.pageStyles,
      history: [...history, currentEntry],
      future: future.slice(1),
      isDirty: true,
    });
  },

  // ─── UI ───────────────────────────────────────────────────────

  setLeftPanel: (panel) => set({ leftPanel: panel }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setPreviewMode: (mode) => set({ previewMode: mode }),
  setCanvasZoom: (zoom) => set({ canvasZoom: Math.max(0.25, Math.min(2, zoom)) }),
  setPreviewFullscreen: (fullscreen) => set({ isPreviewFullscreen: fullscreen }),

  // ─── Computed ─────────────────────────────────────────────────

  getSelectedSection: () => {
    const { sections, selectedSectionId } = get();
    return sections.find((s) => s.id === selectedSectionId);
  },

  getSelectedComponent: () => {
    const { sections, selectedSectionId, selectedComponentId } = get();
    if (!selectedSectionId || !selectedComponentId) return undefined;
    const section = sections.find((s) => s.id === selectedSectionId);
    return section?.components.find((c) => c.id === selectedComponentId);
  },

  canUndo: () => get().history.length > 0,
  canRedo: () => get().future.length > 0,
}));

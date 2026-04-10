import { create } from "zustand";

interface UIState {
  // Sidebar
  sidebarPinned: boolean;
  sidebarHovered: boolean;
  setSidebarPinned: (pinned: boolean) => void;
  toggleSidebarPinned: () => void;
  setSidebarHovered: (hovered: boolean) => void;
  /** true when sidebar should appear expanded (either pinned or hovered) */
  sidebarExpanded: () => boolean;

  // Sub-panel (third-level navigation)
  subPanelId: string | null;
  subPanelCollapsed: boolean;
  setSubPanelId: (id: string | null) => void;
  toggleSubPanelCollapsed: () => void;
  setSubPanelCollapsed: (collapsed: boolean) => void;

  // Legacy compat
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Theme
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarPinned: true,
  sidebarHovered: false,
  setSidebarPinned: (pinned) => set({ sidebarPinned: pinned }),
  toggleSidebarPinned: () => set((s) => ({ sidebarPinned: !s.sidebarPinned })),
  setSidebarHovered: (hovered) => set({ sidebarHovered: hovered }),
  sidebarExpanded: () => get().sidebarPinned || get().sidebarHovered,

  // Sub-panel
  subPanelId: null,
  subPanelCollapsed: false,
  setSubPanelId: (id) => set({ subPanelId: id, subPanelCollapsed: false }),
  toggleSubPanelCollapsed: () => set((s) => ({ subPanelCollapsed: !s.subPanelCollapsed })),
  setSubPanelCollapsed: (collapsed) => set({ subPanelCollapsed: collapsed }),

  // Legacy — mapped to pinned
  get sidebarCollapsed() {
    return !get().sidebarPinned && !get().sidebarHovered;
  },
  toggleSidebar: () => set((s) => ({ sidebarPinned: !s.sidebarPinned })),
  setSidebarCollapsed: (collapsed) => set({ sidebarPinned: !collapsed }),

  theme: "dark",
  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  },
}));

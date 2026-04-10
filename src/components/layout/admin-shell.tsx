"use client";

import { useUIStore } from "@/stores/ui-store";
import { Sidebar } from "@/components/layout/sidebar";
import { SubPanel } from "@/components/layout/sub-panel";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const sidebarPinned = useUIStore((s) => s.sidebarPinned);
  const subPanelId = useUIStore((s) => s.subPanelId);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* Spacer when sidebar is unpinned (fixed), to prevent content from shifting under it */}
      {!sidebarPinned && <div className="shrink-0" style={{ width: 72 }} />}
      {/* Sub-panel for third-level navigation */}
      {subPanelId && <SubPanel />}
      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

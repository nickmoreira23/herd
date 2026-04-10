"use client";

import { PanelLeftOpen } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

/**
 * Client wrapper for <main> that conditionally shows the sub-panel expand button.
 *
 * When the sub-panel is collapsed, the layout becomes a two-column flex:
 *   [ expand-button-column (60px) | page content ]
 *
 * The expand icon sits 20px from the left edge, with a 12px gap to the
 * title/description block. It's vertically positioned to align with the
 * center of a typical page header (title + description).
 */
export function MainContent({ children }: { children: React.ReactNode }) {
  const subPanelId = useUIStore((s) => s.subPanelId);
  const subPanelCollapsed = useUIStore((s) => s.subPanelCollapsed);
  const showExpandButton = !!subPanelId && subPanelCollapsed;

  if (!showExpandButton) {
    return (
      <main className="flex-1 p-6 overflow-auto" id="admin-main">
        {children}
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto" id="admin-main">
      <div className="flex min-h-full">
        {/* Expand button column: 20px left pad + 26px icon (18px + p-1) + ~14px right = 60px total */}
        <div className="shrink-0 w-[3.75rem] pt-6 pl-5">
          {/* pt-6 matches the p-6 on main content, then offset down ~15px
              to vertically center between a ~20px title and ~16px description
              sitting below it (title center ≈ 10px, desc center ≈ 30px → midpoint 20px from top of text block) */}
          <div className="mt-[0.6rem]">
            <button
              onClick={() => useUIStore.getState().setSubPanelCollapsed(false)}
              className="text-muted-foreground hover:text-foreground transition-all duration-200 p-1 rounded-md hover:bg-accent"
              title="Expand panel"
            >
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
        {/* Page content: normal p-6 minus the left (handled by button column + gap) */}
        <div className="flex-1 min-w-0 py-6 pr-6 pl-0">
          {children}
        </div>
      </div>
    </main>
  );
}

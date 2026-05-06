"use client";

import { PanelLeftOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";

/**
 * Pages that own their own header and expand-button placement (full-bleed
 * pages). MainContent skips the standard 60px expand-button column for
 * these so the page can wire the button into its own header.
 */
// Trailing slash on each prefix means we only match the detail/new pages
// (e.g. /admin/tools/projections/new and /admin/tools/projections/{id}),
// NOT the index listing at /admin/tools/projections itself.
//
// Both URL families resolve to FinancialPageClient and that component
// already owns its own header with an edge-to-edge border-b and an
// expand-button slot. Without listing both prefixes here, the operation
// route would inherit MainContent's `p-6` and the inline header's
// bottom border would stop short of the page edges.
const FULL_BLEED_PREFIXES = [
  "/admin/tools/projections/",
  "/admin/operation/finances/projections/",
];

function isFullBleed(pathname: string): boolean {
  return FULL_BLEED_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Client wrapper for <main> that conditionally shows the sub-panel expand button.
 *
 * When the sub-panel is collapsed, the layout becomes a two-column flex:
 *   [ expand-button-column (60px) | page content ]
 *
 * Full-bleed pages render their own expand button inside their header, so
 * the column is skipped for those routes.
 */
export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const subPanelId = useUIStore((s) => s.subPanelId);
  const subPanelCollapsed = useUIStore((s) => s.subPanelCollapsed);
  const showExpandButton =
    !!subPanelId && subPanelCollapsed && !isFullBleed(pathname);

  if (isFullBleed(pathname)) {
    // Full-bleed page handles its own padding & expand button.
    return (
      <main className="relative flex-1 overflow-auto" id="admin-main">
        {children}
      </main>
    );
  }

  if (!showExpandButton) {
    return (
      <main className="relative flex-1 p-6 overflow-auto" id="admin-main">
        {children}
      </main>
    );
  }

  return (
    <main className="relative flex-1 overflow-auto" id="admin-main">
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

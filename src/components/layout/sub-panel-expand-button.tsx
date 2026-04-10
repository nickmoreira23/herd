"use client";

import { PanelLeftOpen } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

/**
 * When the sub-panel is collapsed, this adds left padding to the content area
 * and places the expand icon in that padding space.
 *
 * Layout: 20px left padding | icon (26px with padding) | 12px gap | title+description
 * Total left shift: 20 + 26 + 12 = ~58px → round to 3.75rem (60px)
 *
 * The icon is vertically centered between the page title (h1) and description (p).
 */
export function SubPanelExpandButton() {
  const setSubPanelCollapsed = useUIStore((s) => s.setSubPanelCollapsed);

  return (
    <>
      {/* Shift main content right: 20px pad + icon + 12px gap.
          Target the <main> inside the content wrapper using adjacent sibling of this component's parent. */}
      <style>{`
        [data-subpanel-expand] ~ main {
          padding-left: 3.75rem !important;
        }
      `}</style>
      {/* The expand icon column, 20px from left edge, vertically centered with title+desc.
          The main has p-6 = 24px top padding, title block center ~28px below that = ~52px from top.
          Icon with p-1 = 26px total height, so pt = 52 - 13 = 39px ≈ 2.45rem */}
      <div data-subpanel-expand="" className="absolute top-0 left-0 h-full z-10 flex items-start pt-[2.45rem] pl-5">
        <button
          onClick={() => setSubPanelCollapsed(false)}
          className="text-muted-foreground hover:text-foreground transition-all duration-200 p-1 rounded-md hover:bg-accent h-fit"
          title="Expand panel"
        >
          <PanelLeftOpen className="h-[18px] w-[18px]" />
        </button>
      </div>
    </>
  );
}

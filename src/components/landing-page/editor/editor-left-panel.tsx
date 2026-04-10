"use client";

import { Plus, Layers, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLandingPageEditorStore } from "@/stores/landing-page-editor-store";
import { AddPanel } from "./panels/add-panel";
import { LayersPanel } from "./panels/layers-panel";
import { SettingsPanel } from "./panels/settings-panel";

const tabs = [
  { id: "add" as const, label: "Add", icon: Plus },
  { id: "layers" as const, label: "Layers", icon: Layers },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export function EditorLeftPanel() {
  const leftPanel = useLandingPageEditorStore((s) => s.leftPanel);
  const setLeftPanel = useLandingPageEditorStore((s) => s.setLeftPanel);

  return (
    <div className="flex h-full w-[260px] shrink-0 border-r bg-background">
      {/* Tab bar */}
      <div className="flex w-10 shrink-0 flex-col items-center gap-1 border-r py-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setLeftPanel(id)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              leftPanel === id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-3">
        {leftPanel === "add" && <AddPanel />}
        {leftPanel === "layers" && <LayersPanel />}
        {leftPanel === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}

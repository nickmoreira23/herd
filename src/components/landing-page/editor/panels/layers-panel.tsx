"use client";

import { Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLandingPageEditorStore } from "@/stores/landing-page-editor-store";
import { getComponentDefinition } from "@/lib/landing-page/registry";
import { useState } from "react";

export function LayersPanel() {
  const sections = useLandingPageEditorStore((s) => s.sections);
  const selectedSectionId = useLandingPageEditorStore((s) => s.selectedSectionId);
  const selectedComponentId = useLandingPageEditorStore((s) => s.selectedComponentId);
  const selectSection = useLandingPageEditorStore((s) => s.selectSection);
  const selectComponent = useLandingPageEditorStore((s) => s.selectComponent);
  const toggleSectionVisibility = useLandingPageEditorStore((s) => s.toggleSectionVisibility);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleCollapse(sectionId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  if (sections.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Layers
        </p>
        <p className="text-xs text-muted-foreground">
          No sections yet. Add sections from the Add tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Layers
      </p>
      {sections.map((section) => {
        const isSectionSelected = selectedSectionId === section.id && !selectedComponentId;
        const isExpanded = !collapsed.has(section.id);

        return (
          <div key={section.id}>
            {/* Section row */}
            <div
              className={cn(
                "flex items-center gap-1 px-1.5 py-1 rounded text-xs cursor-pointer transition-colors",
                isSectionSelected
                  ? "bg-blue-500/10 text-blue-700"
                  : "hover:bg-muted text-foreground"
              )}
              onClick={() => selectSection(section.id)}
            >
              <button
                className="shrink-0 p-0.5 hover:bg-muted rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(section.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
              <span className="flex-1 truncate font-medium">
                {section.name || section.sectionType}
              </span>
              <button
                className="shrink-0 p-0.5 hover:bg-muted rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSectionVisibility(section.id);
                }}
              >
                {section.isVisible ? (
                  <Eye className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Component children */}
            {isExpanded && section.components.length > 0 && (
              <div className="ml-4 border-l border-border/50 pl-1.5 space-y-0.5 mt-0.5">
                {section.components.map((comp) => {
                  const def = getComponentDefinition(comp.type);
                  const isCompSelected = selectedComponentId === comp.id;
                  const label =
                    (comp.props.text as string) ||
                    (comp.props.name as string) ||
                    def?.label ||
                    comp.type;

                  return (
                    <div
                      key={comp.id}
                      className={cn(
                        "flex items-center gap-1.5 px-1.5 py-1 rounded text-xs cursor-pointer transition-colors",
                        isCompSelected
                          ? "bg-blue-500/10 text-blue-700"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                      onClick={() => selectComponent(section.id, comp.id)}
                    >
                      <span className="text-[10px] uppercase font-medium w-12 shrink-0 text-muted-foreground">
                        {def?.label || comp.type}
                      </span>
                      <span className="flex-1 truncate">
                        {label.length > 30 ? label.slice(0, 30) + "…" : label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

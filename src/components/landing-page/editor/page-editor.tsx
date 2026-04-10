"use client";

import { useEffect } from "react";
import { PanelRight } from "lucide-react";
import { useLandingPageEditorStore } from "@/stores/landing-page-editor-store";
import { EditorToolbar } from "./editor-toolbar";
import { EditorLeftPanel } from "./editor-left-panel";
import { EditorCanvas } from "./editor-canvas";
import { PropertiesPanel } from "./properties/properties-panel";
import type { LandingPageData, SectionData } from "@/types/landing-page";

interface PageEditorProps {
  initialPage: LandingPageData;
  initialSections: SectionData[];
}

export function PageEditor({ initialPage, initialSections }: PageEditorProps) {
  const loadPage = useLandingPageEditorStore((s) => s.loadPage);
  const rightPanelOpen = useLandingPageEditorStore((s) => s.rightPanelOpen);
  const setRightPanelOpen = useLandingPageEditorStore((s) => s.setRightPanelOpen);
  const selectedComponentId = useLandingPageEditorStore((s) => s.selectedComponentId);
  const selectedSectionId = useLandingPageEditorStore((s) => s.selectedSectionId);

  useEffect(() => {
    loadPage(initialPage, initialSections);
  }, [initialPage, initialSections, loadPage]);

  // Auto-open properties panel when something is selected
  useEffect(() => {
    if (selectedComponentId || selectedSectionId) {
      setRightPanelOpen(true);
    }
  }, [selectedComponentId, selectedSectionId, setRightPanelOpen]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <EditorToolbar />
      <div className="flex flex-1 overflow-hidden relative">
        <EditorLeftPanel />
        <EditorCanvas />
        {rightPanelOpen ? (
          <PropertiesPanel />
        ) : (
          <button
            onClick={() => setRightPanelOpen(true)}
            className="absolute right-0 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-l-md border border-r-0 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Open properties panel"
          >
            <PanelRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

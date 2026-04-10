"use client";

import {
  Type,
  AlignLeft,
  Image,
  MousePointerClick,
  ArrowUpDown,
  Minus,
  Square,
  Columns3,
  Shapes,
  List,
  Tag,
  Play,
  Sparkles,
  LayoutGrid,
  Megaphone,
  Quote,
  PanelBottom,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useLandingPageEditorStore } from "@/stores/landing-page-editor-store";
import { getComponentsByCategory, componentRegistry } from "@/lib/landing-page/registry";
import { sectionTemplates, createComponentNode } from "@/lib/landing-page/utils";
import { DEFAULT_SECTION_LAYOUT } from "@/lib/landing-page/defaults";
import { cn } from "@/lib/utils";

// Icon mapping for component registry icons
const iconMap: Record<string, LucideIcon> = {
  Type,
  AlignLeft,
  Image,
  MousePointerClick,
  ArrowUpDown,
  Minus,
  Square,
  Columns3,
  Shapes,
  List,
  Tag,
  Play,
};

// Icon mapping for section template icons
const sectionIconMap: Record<string, LucideIcon> = {
  Sparkles,
  LayoutGrid,
  Megaphone,
  Quote,
  PanelBottom,
  Plus,
};

const categoryLabels: Record<string, string> = {
  layout: "Layout",
  content: "Content",
  media: "Media",
  interactive: "Interactive",
};

export function AddPanel() {
  const addSection = useLandingPageEditorStore((s) => s.addSection);
  const addComponent = useLandingPageEditorStore((s) => s.addComponent);
  const selectedSectionId = useLandingPageEditorStore((s) => s.selectedSectionId);
  const sections = useLandingPageEditorStore((s) => s.sections);
  const page = useLandingPageEditorStore((s) => s.page);

  const categories = getComponentsByCategory();

  const handleAddSectionTemplate = (templateId: string) => {
    const template = sectionTemplates.find((t) => t.id === templateId);
    if (!template) return;

    const store = useLandingPageEditorStore.getState();
    const insertIndex = store.sections.length;

    // Batch all mutations into a single undo step
    store.batchStart();
    try {
      store.addSection(template.sectionType, insertIndex);

      const newSections = useLandingPageEditorStore.getState().sections;
      const newSection = newSections[insertIndex];
      if (!newSection) return;

      if (template.layout) {
        store.updateSectionLayout(newSection.id, {
          ...DEFAULT_SECTION_LAYOUT,
          ...template.layout,
        });
      }

      for (const comp of template.components) {
        const node = createComponentNode(comp.type, { props: comp.props });
        store.addComponent(newSection.id, node);
      }
    } finally {
      store.batchEnd();
    }
  };

  const handleAddComponent = (type: string) => {
    // If a section is selected, add to it; otherwise add to last section
    let targetSectionId = selectedSectionId;
    if (!targetSectionId && sections.length > 0) {
      targetSectionId = sections[sections.length - 1].id;
    }

    if (!targetSectionId) {
      // No sections exist — create one first
      const store = useLandingPageEditorStore.getState();
      store.addSection("custom");
      const newSections = useLandingPageEditorStore.getState().sections;
      targetSectionId = newSections[newSections.length - 1]?.id;
    }

    if (targetSectionId) {
      const node = createComponentNode(type);
      addComponent(targetSectionId, node);
    }
  };

  return (
    <div className="space-y-5">
      {/* Section Templates */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Sections
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {sectionTemplates.map((template) => {
            const Icon = sectionIconMap[template.icon] || Plus;
            return (
              <button
                key={template.id}
                onClick={() => handleAddSectionTemplate(template.id)}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-transparent bg-muted/50 p-2.5 text-xs transition-colors hover:bg-muted hover:border-foreground/10"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">{template.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Components by Category */}
      {Object.entries(categories).map(([category, components]) => {
        if (components.length === 0) return null;
        return (
          <div key={category}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {categoryLabels[category] || category}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {components.map((def) => {
                const Icon = iconMap[def.icon] || Square;
                return (
                  <button
                    key={def.type}
                    onClick={() => handleAddComponent(def.type)}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-transparent bg-muted/50 p-2.5 text-xs transition-colors hover:bg-muted hover:border-foreground/10"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{def.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

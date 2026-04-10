"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandingPageEditorStore } from "@/stores/landing-page-editor-store";
import { CanvasSection } from "./canvas/canvas-section";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

const PREVIEW_WIDTHS = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function EditorCanvas() {
  const sections = useLandingPageEditorStore((s) => s.sections);
  const previewMode = useLandingPageEditorStore((s) => s.previewMode);
  const addSection = useLandingPageEditorStore((s) => s.addSection);
  const reorderSections = useLandingPageEditorStore((s) => s.reorderSections);

  const canvasWidth = PREVIEW_WIDTHS[previewMode];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sectionIds = useMemo(
    () => sections.map((s) => s.id),
    [sections]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderSections(oldIndex, newIndex);
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-muted/30">
      <div
        className="mx-auto min-h-full transition-all duration-200"
        style={{ maxWidth: canvasWidth }}
      >
        {sections.length === 0 ? (
          <div className="flex h-full items-center justify-center p-12">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Start building your page by adding a section.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addSection("custom")}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add section
              </Button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sectionIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0">
                {sections.map((section) => (
                  <CanvasSection key={section.id} section={section} />
                ))}
                <div className="flex justify-center py-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSection("custom")}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add section
                  </Button>
                </div>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

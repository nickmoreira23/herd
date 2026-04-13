"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormBuilderField } from "./form-builder-field";
import {
  Plus,
  Trash2,
  GripVertical,
  Check,
  X,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import type { FormSectionRow, FormFieldRow } from "../types";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface FormBuilderSectionProps {
  section: FormSectionRow;
  isOnly: boolean;
  onEditField: (field: FormFieldRow) => void;
  onDeleteField: (fieldId: string) => void;
  onAddFieldToSection: (sectionId: string) => void;
  onUpdateSection: (
    sectionId: string,
    data: { title?: string; description?: string }
  ) => void;
  onDeleteSection: (sectionId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function FormBuilderSection({
  section,
  isOnly,
  onEditField,
  onDeleteField,
  onAddFieldToSection,
  onUpdateSection,
  onDeleteSection,
  collapsed,
  onToggleCollapse,
}: FormBuilderSectionProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(section.title || "");

  // Section-level sortable (for reordering sections)
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `section:${section.id}`,
    data: { type: "section", section },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : undefined,
  };

  // Droppable for the field area (so empty sections can receive fields)
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `section-drop:${section.id}`,
    data: { type: "section-container", sectionId: section.id },
  });

  function saveTitle() {
    const trimmed = titleDraft.trim();
    if (trimmed) {
      onUpdateSection(section.id, { title: trimmed });
    }
    setEditingTitle(false);
  }

  const fieldIds = section.fields.map((f) => f.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-card/50 transition-all ${
        isDragging ? "opacity-50 shadow-lg ring-2 ring-primary/30" : ""
      }`}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <div
          ref={setActivatorNodeRef}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 transition-transform" />
          ) : (
            <ChevronDown className="h-4 w-4 transition-transform" />
          )}
        </button>

        {editingTitle ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="h-7 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") {
                  setTitleDraft(section.title || "");
                  setEditingTitle(false);
                }
              }}
            />
            <Button variant="ghost" size="icon-sm" onClick={saveTitle}>
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setTitleDraft(section.title || "");
                setEditingTitle(false);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            className="flex-1 text-left text-sm font-medium hover:underline"
            onClick={() => {
              setTitleDraft(section.title || "");
              setEditingTitle(true);
            }}
          >
            {section.title || "Untitled Section"}
            {collapsed && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({section.fields.length} field
                {section.fields.length !== 1 ? "s" : ""})
              </span>
            )}
          </button>
        )}

        {!isOnly && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDeleteSection(section.id)}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        )}
      </div>

      {/* Fields — collapsible with smooth animation */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: collapsed ? "0fr" : "1fr" }}
      >
        <div className="overflow-hidden">
          <div ref={setDroppableRef} className="p-3 space-y-2">
            <SortableContext
              items={fieldIds}
              strategy={verticalListSortingStrategy}
            >
              {section.fields.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No fields yet. Click &ldquo;Add Field&rdquo; or use the
                  sidebar.
                </div>
              ) : (
                section.fields.map((field) => (
                  <FormBuilderField
                    key={field.id}
                    field={field}
                    onEdit={onEditField}
                    onDelete={onDeleteField}
                  />
                ))
              )}
            </SortableContext>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => onAddFieldToSection(section.id)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Field
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

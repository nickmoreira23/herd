"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { FieldTypeIcon, FIELD_TYPE_CONFIG } from "./field-type-icon";
import type { FormFieldRow } from "../types";
import type { FormFieldType } from "@/lib/validations/knowledge-form";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FormBuilderFieldProps {
  field: FormFieldRow;
  onEdit: (field: FormFieldRow) => void;
  onDelete: (fieldId: string) => void;
}

export function FormBuilderField({
  field,
  onEdit,
  onDelete,
}: FormBuilderFieldProps) {
  const typeConfig = FIELD_TYPE_CONFIG[field.type as FormFieldType];

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: { type: "field", field, sectionId: field.sectionId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 transition-shadow ${
        isDragging
          ? "shadow-lg ring-2 ring-primary/30 border-primary/30 opacity-90"
          : "hover:border-foreground/20"
      }`}
    >
      <div
        ref={setActivatorNodeRef}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <FieldTypeIcon
        type={field.type as FormFieldType}
        className="h-4 w-4 text-muted-foreground shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{field.label}</span>
          {field.isRequired && (
            <span className="text-xs text-red-500 font-medium">*</span>
          )}
        </div>
        {field.helpText && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {field.helpText}
          </p>
        )}
      </div>

      <Badge variant="outline" className="text-[10px] shrink-0">
        {typeConfig?.label ?? field.type}
      </Badge>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(field)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(field.id)}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

"use client";

import { FIELD_TYPE_CONFIG } from "./field-type-icon";
import { FORM_FIELD_TYPES, type FormFieldType } from "@/lib/validations/knowledge-form";

interface FormBuilderSidebarProps {
  onAddField: (type: FormFieldType) => void;
}

export function FormBuilderSidebar({ onAddField }: FormBuilderSidebarProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground mb-3 px-1">
        Add Field
      </p>
      {FORM_FIELD_TYPES.map((type) => {
        const config = FIELD_TYPE_CONFIG[type];
        const Icon = config.icon;
        return (
          <button
            key={type}
            onClick={() => onAddField(type)}
            className="flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent transition-colors"
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

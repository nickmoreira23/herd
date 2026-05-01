"use client";

import { FORM_FIELD_TYPE_OPTIONS } from "./field-type-icon";
import { FORM_FIELD_TYPES, type FormFieldType } from "@/lib/validations/knowledge-form";
import { useT } from "@/lib/i18n/locale-context";

interface FormBuilderSidebarProps {
  onAddField: (type: FormFieldType) => void;
}

export function FormBuilderSidebar({ onAddField }: FormBuilderSidebarProps) {
  const t = useT();
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground mb-3 px-1">
        {t("forms.builder.sidebar.add_field_heading")}
      </p>
      {FORM_FIELD_TYPES.map((type) => {
        const meta = FORM_FIELD_TYPE_OPTIONS[type];
        const Icon = meta.icon;
        return (
          <button
            key={type}
            onClick={() => onAddField(type)}
            className="flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent transition-colors"
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs">{t(meta.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}

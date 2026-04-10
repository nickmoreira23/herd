"use client";

import { PublicFormField } from "./public-form-field";

interface SectionField {
  id: string;
  label: string;
  type: string;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  options: { choices: string[] } | null;
  validation: Record<string, unknown> | null;
  conditionalLogic: { fieldId: string; operator: string; value?: unknown } | null;
}

interface SectionDef {
  id: string;
  title: string | null;
  description: string | null;
  fields: SectionField[];
}

interface PublicFormSectionProps {
  section: SectionDef;
  answers: Record<string, unknown>;
  errors: Record<string, string>;
  onFieldChange: (fieldId: string, value: unknown) => void;
  visibleFieldIds: Set<string>;
}

export function PublicFormSection({
  section,
  answers,
  errors,
  onFieldChange,
  visibleFieldIds,
}: PublicFormSectionProps) {
  const visibleFields = section.fields.filter((f) => visibleFieldIds.has(f.id));

  if (visibleFields.length === 0) return null;

  return (
    <div className="space-y-5">
      {section.title && (
        <div>
          <h2 className="text-base font-semibold">{section.title}</h2>
          {section.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {section.description}
            </p>
          )}
        </div>
      )}

      {visibleFields.map((field) => (
        <PublicFormField
          key={field.id}
          field={field}
          value={answers[field.id]}
          onChange={onFieldChange}
          error={errors[field.id]}
        />
      ))}
    </div>
  );
}

"use client";

import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  Calendar,
  Clock,
  ChevronDown,
  ListChecks,
  CheckSquare,
  CircleDot,
  Upload,
  Star,
  ToggleLeft,
  PenTool,
  type LucideIcon,
} from "lucide-react";
import type { FormFieldType } from "@/lib/validations/knowledge-form";
import type { MessageKey } from "@/lib/i18n/t";

export interface FormFieldTypeMeta {
  value: FormFieldType;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  icon: LucideIcon;
}

/**
 * Template D — stable enum value paired with translation keys and icon.
 * Consumers translate `labelKey`/`descriptionKey` via `useT()` at render time.
 */
export const FORM_FIELD_TYPE_OPTIONS = {
  TEXT: {
    value: "TEXT",
    labelKey: "forms.field_types.TEXT.label",
    descriptionKey: "forms.field_types.TEXT.description",
    icon: Type,
  },
  TEXTAREA: {
    value: "TEXTAREA",
    labelKey: "forms.field_types.TEXTAREA.label",
    descriptionKey: "forms.field_types.TEXTAREA.description",
    icon: AlignLeft,
  },
  NUMBER: {
    value: "NUMBER",
    labelKey: "forms.field_types.NUMBER.label",
    descriptionKey: "forms.field_types.NUMBER.description",
    icon: Hash,
  },
  EMAIL: {
    value: "EMAIL",
    labelKey: "forms.field_types.EMAIL.label",
    descriptionKey: "forms.field_types.EMAIL.description",
    icon: Mail,
  },
  PHONE: {
    value: "PHONE",
    labelKey: "forms.field_types.PHONE.label",
    descriptionKey: "forms.field_types.PHONE.description",
    icon: Phone,
  },
  DATE: {
    value: "DATE",
    labelKey: "forms.field_types.DATE.label",
    descriptionKey: "forms.field_types.DATE.description",
    icon: Calendar,
  },
  TIME: {
    value: "TIME",
    labelKey: "forms.field_types.TIME.label",
    descriptionKey: "forms.field_types.TIME.description",
    icon: Clock,
  },
  SELECT: {
    value: "SELECT",
    labelKey: "forms.field_types.SELECT.label",
    descriptionKey: "forms.field_types.SELECT.description",
    icon: ChevronDown,
  },
  MULTI_SELECT: {
    value: "MULTI_SELECT",
    labelKey: "forms.field_types.MULTI_SELECT.label",
    descriptionKey: "forms.field_types.MULTI_SELECT.description",
    icon: ListChecks,
  },
  CHECKBOX: {
    value: "CHECKBOX",
    labelKey: "forms.field_types.CHECKBOX.label",
    descriptionKey: "forms.field_types.CHECKBOX.description",
    icon: CheckSquare,
  },
  RADIO: {
    value: "RADIO",
    labelKey: "forms.field_types.RADIO.label",
    descriptionKey: "forms.field_types.RADIO.description",
    icon: CircleDot,
  },
  FILE_UPLOAD: {
    value: "FILE_UPLOAD",
    labelKey: "forms.field_types.FILE_UPLOAD.label",
    descriptionKey: "forms.field_types.FILE_UPLOAD.description",
    icon: Upload,
  },
  RATING: {
    value: "RATING",
    labelKey: "forms.field_types.RATING.label",
    descriptionKey: "forms.field_types.RATING.description",
    icon: Star,
  },
  YES_NO: {
    value: "YES_NO",
    labelKey: "forms.field_types.YES_NO.label",
    descriptionKey: "forms.field_types.YES_NO.description",
    icon: ToggleLeft,
  },
  SIGNATURE: {
    value: "SIGNATURE",
    labelKey: "forms.field_types.SIGNATURE.label",
    descriptionKey: "forms.field_types.SIGNATURE.description",
    icon: PenTool,
  },
} as const satisfies Record<FormFieldType, FormFieldTypeMeta>;

interface FieldTypeIconProps {
  type: FormFieldType;
  className?: string;
}

export function FieldTypeIcon({ type, className }: FieldTypeIconProps) {
  const meta = FORM_FIELD_TYPE_OPTIONS[type];
  if (!meta) return null;
  const Icon = meta.icon;
  return <Icon className={className} />;
}

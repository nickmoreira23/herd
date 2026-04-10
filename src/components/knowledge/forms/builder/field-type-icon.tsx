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

export const FIELD_TYPE_CONFIG: Record<
  FormFieldType,
  { label: string; icon: LucideIcon; description: string }
> = {
  TEXT: { label: "Short Text", icon: Type, description: "Single-line text input" },
  TEXTAREA: { label: "Long Text", icon: AlignLeft, description: "Multi-line text area" },
  NUMBER: { label: "Number", icon: Hash, description: "Numeric input" },
  EMAIL: { label: "Email", icon: Mail, description: "Email address input" },
  PHONE: { label: "Phone", icon: Phone, description: "Phone number input" },
  DATE: { label: "Date", icon: Calendar, description: "Date picker" },
  TIME: { label: "Time", icon: Clock, description: "Time picker" },
  SELECT: { label: "Dropdown", icon: ChevronDown, description: "Single-choice dropdown" },
  MULTI_SELECT: { label: "Multi-Select", icon: ListChecks, description: "Multiple-choice checkboxes" },
  CHECKBOX: { label: "Checkbox", icon: CheckSquare, description: "Single checkbox toggle" },
  RADIO: { label: "Radio", icon: CircleDot, description: "Single-choice radio buttons" },
  FILE_UPLOAD: { label: "File Upload", icon: Upload, description: "File attachment" },
  RATING: { label: "Rating", icon: Star, description: "Numeric rating scale" },
  YES_NO: { label: "Yes / No", icon: ToggleLeft, description: "Binary yes/no toggle" },
  SIGNATURE: { label: "Signature", icon: PenTool, description: "Signature capture pad" },
};

interface FieldTypeIconProps {
  type: FormFieldType;
  className?: string;
}

export function FieldTypeIcon({ type, className }: FieldTypeIconProps) {
  const config = FIELD_TYPE_CONFIG[type];
  if (!config) return null;
  const Icon = config.icon;
  return <Icon className={className} />;
}

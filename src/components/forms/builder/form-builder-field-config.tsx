"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Loader2 } from "lucide-react";
import { FORM_FIELD_TYPES, type FormFieldType } from "@/lib/validations/knowledge-form";
import { FIELD_TYPE_CONFIG } from "./field-type-icon";
import type { FormFieldRow } from "../types";

interface FormBuilderFieldConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: FormFieldRow | null;
  formId: string;
  sectionId: string;
  onSave: () => void;
  defaultType?: FormFieldType | null;
}

const CHOICE_FIELD_TYPES: FormFieldType[] = ["SELECT", "MULTI_SELECT", "RADIO"];

export function FormBuilderFieldConfig({
  open,
  onOpenChange,
  field,
  formId,
  sectionId,
  onSave,
  defaultType,
}: FormBuilderFieldConfigProps) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FormFieldType>("TEXT");
  const [placeholder, setPlaceholder] = useState("");
  const [helpText, setHelpText] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [choices, setChoices] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);

  const isEdit = !!field;

  useEffect(() => {
    if (field) {
      // Editing an existing field
      setLabel(field.label);
      setType(field.type as FormFieldType);
      setPlaceholder(field.placeholder || "");
      setHelpText(field.helpText || "");
      setIsRequired(field.isRequired);
      setChoices(
        field.options?.choices?.length ? field.options.choices : [""]
      );
    } else {
      // Adding a new field - use defaultType if provided
      setLabel("");
      setType(defaultType || "TEXT");
      setPlaceholder("");
      setHelpText("");
      setIsRequired(false);
      setChoices([""]);
    }
  }, [field, open, defaultType]);

  const showChoices = CHOICE_FIELD_TYPES.includes(type);

  async function handleSave() {
    if (!label.trim()) return;
    setSaving(true);

    const payload: Record<string, unknown> = {
      label: label.trim(),
      type,
      placeholder: placeholder.trim() || undefined,
      helpText: helpText.trim() || undefined,
      isRequired,
    };

    if (showChoices) {
      const validChoices = choices.map((c) => c.trim()).filter(Boolean);
      if (validChoices.length > 0) {
        payload.options = { choices: validChoices };
      }
    }

    try {
      if (isEdit && field) {
        await fetch(`/api/forms/${formId}/fields/${field.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        payload.sectionId = sectionId;
        await fetch(`/api/forms/${formId}/fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      onSave();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Field" : "Add Field"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. What is your name?"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Field Type</Label>
            <Select value={type} onValueChange={(v) => { if (v) setType(v as FormFieldType); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORM_FIELD_TYPES.map((ft) => (
                  <SelectItem key={ft} value={ft}>
                    {FIELD_TYPE_CONFIG[ft].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Placeholder (optional)</Label>
            <Input
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="Placeholder text shown in the input"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Help Text (optional)</Label>
            <Textarea
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              placeholder="Additional instructions for the respondent"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Required</Label>
            <Switch checked={isRequired} onCheckedChange={setIsRequired} />
          </div>

          {showChoices && (
            <div className="space-y-1.5">
              <Label className="text-xs">Choices</Label>
              <div className="space-y-2">
                {choices.map((choice, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={choice}
                      onChange={(e) => {
                        const next = [...choices];
                        next[idx] = e.target.value;
                        setChoices(next);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1"
                    />
                    {choices.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          setChoices(choices.filter((_, i) => i !== idx))
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChoices([...choices, ""])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Option
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !label.trim()}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Add Field"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

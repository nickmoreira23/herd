"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { PublicFormSection } from "./public-form-section";
import { PublicFormSuccess } from "./public-form-success";

interface FormField {
  id: string;
  label: string;
  type: string;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  options: { choices: string[] } | null;
  validation: Record<string, unknown> | null;
  conditionalLogic: {
    fieldId: string;
    operator: string;
    value?: unknown;
  } | null;
  sortOrder: number;
}

interface FormSection {
  id: string;
  title: string | null;
  description: string | null;
  sortOrder: number;
  fields: FormField[];
}

interface FormData {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  thankYouMessage: string | null;
  sections: FormSection[];
}

interface PublicFormRendererProps {
  slug: string;
  form: FormData;
}

export function PublicFormRenderer({ slug, form }: PublicFormRendererProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Collect all fields
  const allFields = useMemo(
    () => form.sections.flatMap((s) => s.fields),
    [form.sections]
  );

  // Evaluate conditional logic to determine visible fields
  const visibleFieldIds = useMemo(() => {
    const visible = new Set<string>();
    for (const field of allFields) {
      if (!field.conditionalLogic) {
        visible.add(field.id);
        continue;
      }
      const { fieldId, operator, value: expected } = field.conditionalLogic;
      const actual = answers[fieldId];
      let show = false;
      switch (operator) {
        case "equals":
          show = actual === expected;
          break;
        case "not_equals":
          show = actual !== expected;
          break;
        case "contains":
          show =
            typeof actual === "string" &&
            typeof expected === "string" &&
            actual.toLowerCase().includes(expected.toLowerCase());
          break;
        case "not_empty":
          show =
            actual !== undefined &&
            actual !== null &&
            actual !== "" &&
            !(Array.isArray(actual) && actual.length === 0);
          break;
        case "is_empty":
          show =
            actual === undefined ||
            actual === null ||
            actual === "" ||
            (Array.isArray(actual) && actual.length === 0);
          break;
        default:
          show = true;
      }
      if (show) visible.add(field.id);
    }
    return visible;
  }, [allFields, answers]);

  function handleFieldChange(fieldId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    for (const field of allFields) {
      if (!visibleFieldIds.has(field.id)) continue;
      if (field.isRequired) {
        const val = answers[field.id];
        const isEmpty =
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0);

        // For file uploads, check if the file object has a name
        if (field.type === "FILE_UPLOAD") {
          const fileVal = val as { name?: string } | null | undefined;
          if (!fileVal || !fileVal.name) {
            newErrors[field.id] = "This field is required";
          }
        } else if (field.type === "YES_NO" || field.type === "CHECKBOX") {
          // Booleans: undefined/null means not answered
          if (val === undefined || val === null) {
            newErrors[field.id] = "This field is required";
          }
        } else if (isEmpty) {
          newErrors[field.id] = "This field is required";
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/forms/public/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          submitterName: submitterName.trim() || undefined,
          submitterEmail: submitterEmail.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const json = await res.json().catch(() => null);
        const errorField = json?.error;
        if (errorField) {
          setErrors({ _form: errorField });
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <PublicFormSuccess
        formName={form.name}
        thankYouMessage={form.thankYouMessage}
      />
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      {/* Header */}
      <div className="px-6 py-5 border-b">
        <h1 className="text-xl font-semibold">{form.name}</h1>
        {form.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {form.description}
          </p>
        )}
      </div>

      {/* Sections & Fields */}
      <div className="px-6 py-5 space-y-8">
        {/* Optional submitter info */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Your Name (optional)</Label>
            <Input
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Your Email (optional)</Label>
            <Input
              type="email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
        </div>

        <div className="border-t" />

        {form.sections.map((section) => (
          <PublicFormSection
            key={section.id}
            section={section}
            answers={answers}
            errors={errors}
            onFieldChange={handleFieldChange}
            visibleFieldIds={visibleFieldIds}
          />
        ))}

        {errors._form && (
          <p className="text-sm text-red-500">{errors._form}</p>
        )}
      </div>

      {/* Submit */}
      <div className="px-6 py-4 border-t">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Response
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

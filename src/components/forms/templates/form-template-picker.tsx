"use client";

import { useState, useEffect } from "react";
import { FormTemplateCard } from "./form-template-card";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

interface Template {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  fieldCount: number;
  sectionCount: number;
}

interface FormTemplatePickerProps {
  onCreated: (formId: string) => void;
}

export function FormTemplatePicker({ onCreated }: FormTemplatePickerProps) {
  const t = useT();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/forms/templates")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setTemplates(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleUse(key: string) {
    setCreating(key);
    try {
      const res = await fetch(`/api/forms/templates/${key}`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        notifySuccess("forms.feedback.template_applied", t);
        onCreated(json.data.id);
      } else {
        notifyError("error.forms.template_apply_failed", t);
      }
    } finally {
      setCreating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {templates.map((tpl) => (
        <FormTemplateCard
          key={tpl.key}
          templateKey={tpl.key}
          fallbackName={tpl.name}
          fallbackDescription={tpl.description}
          fallbackCategory={tpl.category}
          icon={tpl.icon}
          fieldCount={tpl.fieldCount}
          onUse={() => handleUse(tpl.key)}
          loading={creating === tpl.key}
        />
      ))}
    </div>
  );
}

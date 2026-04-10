"use client";

import { useState, useEffect } from "react";
import { FormTemplateCard } from "./form-template-card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/knowledge/forms/templates")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setTemplates(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleUse(key: string) {
    setCreating(key);
    try {
      const res = await fetch(`/api/knowledge/forms/templates/${key}`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        toast.success("Form created from template");
        onCreated(json.data.id);
      } else {
        toast.error("Failed to create form from template");
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
      {templates.map((t) => (
        <FormTemplateCard
          key={t.key}
          name={t.name}
          description={t.description}
          icon={t.icon}
          category={t.category}
          fieldCount={t.fieldCount}
          onUse={() => handleUse(t.key)}
          loading={creating === t.key}
        />
      ))}
    </div>
  );
}

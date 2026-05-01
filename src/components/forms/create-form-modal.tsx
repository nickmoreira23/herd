"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClipboardList, Loader2, FileText, LayoutTemplate } from "lucide-react";
import { FormTemplatePicker } from "./templates/form-template-picker";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

interface CreateFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (formId?: string) => void;
}

export function CreateFormModal({
  open,
  onOpenChange,
  onComplete,
}: CreateFormModalProps) {
  const t = useT();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setDescription("");
    setSubmitting(false);
  }

  async function handleSubmit() {
    if (!name.trim()) {
      notifyError("error.forms.name_required", t);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        notifyError("error.forms.create_failed", t);
        return;
      }

      const json = await res.json();
      notifySuccess("forms.feedback.form_created", t);
      reset();
      onOpenChange(false);
      onComplete(json.data?.id);
    } finally {
      setSubmitting(false);
    }
  }

  function handleTemplateCreated(formId: string) {
    reset();
    onOpenChange(false);
    onComplete(formId);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!submitting) {
          onOpenChange(v);
          if (!v) reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("forms.create.title")}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="blank" className="mt-2">
          <TabsList>
            <TabsTrigger value="blank">
              <FileText className="h-3 w-3 mr-1" />
              {t("forms.create.tab.blank")}
            </TabsTrigger>
            <TabsTrigger value="templates">
              <LayoutTemplate className="h-3 w-3 mr-1" />
              {t("forms.create.tab.templates")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blank">
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("forms.create.name_label")}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("forms.create.name_placeholder")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("forms.create.description_label")}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("forms.create.description_placeholder")}
                  rows={2}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || !name.trim()}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    {t("forms.create.submitting")}
                  </>
                ) : (
                  <>
                    <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                    {t("forms.create.submit_blank")}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-3">
                {t("forms.create.templates_hint")}
              </p>
              <FormTemplatePicker onCreated={handleTemplateCreated} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

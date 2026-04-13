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
import { toast } from "sonner";
import { FormTemplatePicker } from "./templates/form-template-picker";

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
      toast.error("Name is required");
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
        const err = await res.json().catch(() => null);
        toast.error(err?.error || "Failed to create form");
        return;
      }

      const json = await res.json();
      toast.success("Form created");
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
          <DialogTitle>Create Form</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="blank" className="mt-2">
          <TabsList>
            <TabsTrigger value="blank">
              <FileText className="h-3 w-3 mr-1" />
              Blank Form
            </TabsTrigger>
            <TabsTrigger value="templates">
              <LayoutTemplate className="h-3 w-3 mr-1" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blank">
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Team Onboarding, Customer Feedback"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description (optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this form for?"
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
                    Creating...
                  </>
                ) : (
                  <>
                    <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                    Create Blank Form
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-3">
                Choose a pre-made template to get started quickly. You can
                customize it after creation.
              </p>
              <FormTemplatePicker onCreated={handleTemplateCreated} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table2, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

interface CreateTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function CreateTableModal({
  open,
  onOpenChange,
  onComplete,
}: CreateTableModalProps) {
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
      notifyError("error.tables.name_required", t);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        notifyError("error.tables.create_failed", t);
        return;
      }

      notifySuccess("tables.feedback.table_created", t);
      reset();
      onOpenChange(false);
      onComplete();
    } finally {
      setSubmitting(false);
    }
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("tables.create.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("tables.create.field_name_label")}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("tables.create.field_name_placeholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("tables.create.field_description_label")}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("tables.create.field_description_placeholder")}
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
                {t("tables.create.submitting")}
              </>
            ) : (
              <>
                <Table2 className="h-3.5 w-3.5 mr-1.5" />
                {t("tables.create.submit")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { notifyError, notifySuccess } from "@/lib/i18n/notify";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

interface KnowledgeCreateTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function KnowledgeCreateTableModal({
  open,
  onOpenChange,
  onComplete,
}: KnowledgeCreateTableModalProps) {
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
      notifyError("error.knowledge.tables.name_required", t);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/knowledge/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        if (err?.code) {
          notifyError(err, t);
        } else {
          notifyError("error.knowledge.tables.create_failed" as MessageKey, t);
        }
        return;
      }

      notifySuccess("knowledge.tables.feedback.created", t);
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
          <DialogTitle>{t("knowledge.tables.create.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("knowledge.tables.create.name_label")}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("knowledge.tables.create.name_placeholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("knowledge.tables.create.description_label")}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("knowledge.tables.create.description_placeholder")}
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
                {t("knowledge.tables.create.creating")}
              </>
            ) : (
              <>
                <Table2 className="h-3.5 w-3.5 mr-1.5" />
                {t("knowledge.tables.create.submit")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

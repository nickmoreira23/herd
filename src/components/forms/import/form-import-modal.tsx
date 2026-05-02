"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Upload, Loader2, FileText } from "lucide-react";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

interface FormImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (formId: string) => void;
}

const FORMATS: ReadonlyArray<{
  value: string;
  accept: string;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
}> = [
  {
    value: "google_forms",
    accept: ".json",
    labelKey: "forms.import.format.google_forms.label",
    descriptionKey: "forms.import.format.google_forms.description",
  },
  {
    value: "typeform",
    accept: ".json",
    labelKey: "forms.import.format.typeform.label",
    descriptionKey: "forms.import.format.typeform.description",
  },
  {
    value: "surveymonkey",
    accept: ".csv",
    labelKey: "forms.import.format.surveymonkey.label",
    descriptionKey: "forms.import.format.surveymonkey.description",
  },
];

export function FormImportModal({
  open,
  onOpenChange,
  onImported,
}: FormImportModalProps) {
  const t = useT();
  const [format, setFormat] = useState("google_forms");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFormat = FORMATS.find((f) => f.value === format);

  function reset() {
    setFormat("google_forms");
    setFile(null);
    setImporting(false);
  }

  async function handleImport() {
    if (!file) {
      notifyError("error.forms.import.no_file_selected", t);
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("format", format);

      const res = await fetch("/api/forms/import", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        notifySuccess("forms.import.feedback.imported_successfully", t);
        reset();
        onOpenChange(false);
        onImported(json.data.id);
      } else {
        notifyError("error.forms.import.failed", t);
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!importing) {
          onOpenChange(v);
          if (!v) reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("forms.import.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("forms.import.format_label")}</Label>
            <Select value={format} onValueChange={(v) => setFormat(v ?? "google_forms")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {t(f.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFormat && (
              <p className="text-xs text-muted-foreground">
                {t(selectedFormat.descriptionKey)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("forms.import.file_label")}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept={selectedFormat?.accept || ".json,.csv"}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-lg border border-dashed p-6 text-center hover:bg-accent/50 transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("forms.import.file_size_kb", {
                      size: (file.size / 1024).toFixed(1),
                    })}
                  </span>
                </div>
              ) : (
                <div>
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {t("forms.import.click_to_select", {
                      accept: selectedFormat?.accept || "",
                    })}
                  </p>
                </div>
              )}
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button onClick={handleImport} disabled={importing || !file}>
            {importing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                {t("forms.import.submitting")}
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {t("forms.import.submit")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { toast } from "sonner";

interface FormImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (formId: string) => void;
}

const FORMATS = [
  {
    value: "google_forms",
    label: "Google Forms (JSON)",
    accept: ".json",
    description: "Export your Google Form as JSON",
  },
  {
    value: "typeform",
    label: "Typeform (JSON)",
    accept: ".json",
    description: "Export your Typeform as JSON",
  },
  {
    value: "surveymonkey",
    label: "SurveyMonkey (CSV)",
    accept: ".csv",
    description: "Export survey results as CSV",
  },
];

export function FormImportModal({
  open,
  onOpenChange,
  onImported,
}: FormImportModalProps) {
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
      toast.error("Please select a file");
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("format", format);

      const res = await fetch("/api/knowledge/forms/import", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        toast.success("Form imported successfully");
        reset();
        onOpenChange(false);
        onImported(json.data.id);
      } else {
        const json = await res.json().catch(() => null);
        toast.error(json?.error || "Failed to import form");
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
          <DialogTitle>Import Form</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v ?? "google_forms")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFormat && (
              <p className="text-xs text-muted-foreground">
                {selectedFormat.description}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">File</Label>
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
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ) : (
                <div>
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Click to select a {selectedFormat?.accept || ""} file
                  </p>
                </div>
              )}
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importing || !file}>
            {importing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Import Form
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

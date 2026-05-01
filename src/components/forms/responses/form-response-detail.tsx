"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { FormResponseRow, FormSectionRow } from "../types";
import type { Locale } from "@/lib/i18n/locales";
import { useT } from "@/lib/i18n/locale-context";
import { formatDate } from "@/lib/i18n/format-date";

interface FormResponseDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: FormResponseRow | null;
  sections: FormSectionRow[];
  locale: Locale;
}

const STATUS_TO_KEY = {
  PENDING: "forms.responses.status.PENDING",
  PROCESSING: "forms.responses.status.PROCESSING",
  READY: "forms.responses.status.READY",
  ERROR: "forms.responses.status.ERROR",
} as const;

export function FormResponseDetail({
  open,
  onOpenChange,
  response,
  sections,
  locale,
}: FormResponseDetailProps) {
  const t = useT();
  if (!response) return null;

  const allFields = sections.flatMap((s) =>
    s.fields.map((f) => ({ ...f, sectionTitle: s.title }))
  );

  const statusKey =
    STATUS_TO_KEY[response.status as keyof typeof STATUS_TO_KEY] ??
    STATUS_TO_KEY.PENDING;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("forms.responses.detail.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 text-xs text-muted-foreground mb-4">
          <p>
            <span className="font-medium">{t("forms.responses.detail.submitter")}</span>{" "}
            {response.submitterName || t("forms.responses.anonymous")}
            {response.submitterEmail && ` (${response.submitterEmail})`}
          </p>
          <p>
            <span className="font-medium">{t("forms.responses.detail.submitted")}</span>{" "}
            {formatDate(new Date(response.submittedAt), locale, "dateTime")}
          </p>
          <Badge
            variant="outline"
            className={`text-[10px] ${
              response.status === "READY"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : response.status === "ERROR"
                ? "bg-red-500/10 text-red-500 border-red-500/20"
                : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
            }`}
          >
            {t(statusKey)}
          </Badge>
        </div>

        <div className="space-y-4">
          {allFields.map((field) => {
            const value = response.answers[field.id];
            if (value === undefined || value === null) return null;

            return (
              <div key={field.id} className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {field.label}
                </p>
                <p className="text-sm">
                  {Array.isArray(value)
                    ? value.join(", ")
                    : typeof value === "boolean"
                    ? value
                      ? t("forms.responses.value.yes")
                      : t("forms.responses.value.no")
                    : String(value)}
                </p>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeFormResponseRow, KnowledgeFormSectionRow } from "../types";

interface FormResponseDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: KnowledgeFormResponseRow | null;
  sections: KnowledgeFormSectionRow[];
}

export function FormResponseDetail({
  open,
  onOpenChange,
  response,
  sections,
}: FormResponseDetailProps) {
  if (!response) return null;

  const allFields = sections.flatMap((s) =>
    s.fields.map((f) => ({ ...f, sectionTitle: s.title }))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Response Detail</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 text-xs text-muted-foreground mb-4">
          <p>
            <span className="font-medium">Submitter:</span>{" "}
            {response.submitterName || "Anonymous"}
            {response.submitterEmail && ` (${response.submitterEmail})`}
          </p>
          <p>
            <span className="font-medium">Submitted:</span>{" "}
            {new Date(response.submittedAt).toLocaleString()}
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
            {response.status}
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
                      ? "Yes"
                      : "No"
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

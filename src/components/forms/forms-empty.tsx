"use client";

import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";

interface FormsEmptyProps {
  onCreateClick: () => void;
}

export function FormsEmpty({ onCreateClick }: FormsEmptyProps) {
  const t = useT();
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center rounded-xl border border-dashed bg-card">
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-violet-500/10 mb-5">
        <ClipboardList className="h-8 w-8 text-violet-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{t("forms.empty.title")}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {t("forms.empty.description")}
      </p>
      <Button variant="outline" onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        {t("forms.empty.create_first")}
      </Button>
    </div>
  );
}

"use client";

import { Building2, X } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

/**
 * Sub-26.4a — banner persistente de contexto vertical.
 *
 * Loud e impossível de não notar: sticky no topo, full-width, alto contraste
 * via tokens de tema (bg-primary / text-primary-foreground — sem hex). Fica
 * visível enquanto o usuário opera uma sub-org através da matriz (a clareza de
 * contexto é a proteção primária contra escrita vertical acidental).
 */
export function OrgContextBanner({
  childName,
  parentName,
  onExit,
}: {
  childName: string;
  parentName: string;
  onExit: () => void;
}) {
  const t = useT();
  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground shadow-md">
      <Building2 className="h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm font-semibold">
        {t("organization.hierarchy.banner_text", {
          child: childName,
          parent: parentName,
        })}
      </p>
      <button
        onClick={onExit}
        className="flex items-center gap-1.5 rounded-md bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-primary-foreground/25"
      >
        <X className="h-3.5 w-3.5" />
        {t("organization.hierarchy.banner_exit")}
      </button>
    </div>
  );
}

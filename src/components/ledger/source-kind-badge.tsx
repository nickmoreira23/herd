"use client";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/locale-context";
import type { MessageKey } from "@/lib/i18n/t";

type SourceKind =
  | "TRANSACTION"
  | "COMMISSION"
  | "REFUND"
  | "MANUAL_ADJUSTMENT"
  | "SEED"
  | "REVERSAL";

const SOURCE_KIND_LABEL_KEYS = {
  TRANSACTION: "ledger.source_kind.transaction",
  COMMISSION: "ledger.source_kind.commission",
  REFUND: "ledger.source_kind.refund",
  MANUAL_ADJUSTMENT: "ledger.source_kind.manual_adjustment",
  SEED: "ledger.source_kind.seed",
  REVERSAL: "ledger.source_kind.reversal",
} as const satisfies Record<SourceKind, MessageKey>;

interface SourceKindBadgeProps {
  kind: string;
  className?: string;
}

export function SourceKindBadge({ kind, className }: SourceKindBadgeProps) {
  const t = useT();
  const key = (SOURCE_KIND_LABEL_KEYS as Record<string, MessageKey>)[kind];
  const label = key ? t(key) : kind;
  return (
    <Badge variant="outline" className={className ?? "text-xs"}>
      {label}
    </Badge>
  );
}

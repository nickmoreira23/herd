"use client";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/locale-context";
import type { MessageKey } from "@/lib/i18n/t";
import type { AccountType } from "@/lib/ledger";

const ACCOUNT_TYPE_LABEL_KEYS = {
  ASSET: "ledger.account_type.asset",
  LIABILITY: "ledger.account_type.liability",
  EQUITY: "ledger.account_type.equity",
  REVENUE: "ledger.account_type.revenue",
  EXPENSE: "ledger.account_type.expense",
} as const satisfies Record<AccountType, MessageKey>;

const ACCOUNT_TYPE_CLASS = {
  ASSET: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  LIABILITY: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  REVENUE: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  EXPENSE: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  EQUITY: "bg-violet-500/10 text-violet-600 border-violet-500/20",
} as const satisfies Record<AccountType, string>;

interface AccountTypeBadgeProps {
  /** Accepts the AccountType enum string. Loose-typed because serialized
   *  payloads from the API surface it as `string`. Falls back to the raw
   *  value when it doesn't match a known type. */
  type: string;
}

function isAccountType(value: string): value is AccountType {
  return value in ACCOUNT_TYPE_LABEL_KEYS;
}

export function AccountTypeBadge({ type }: AccountTypeBadgeProps) {
  const t = useT();
  if (!isAccountType(type)) {
    return <Badge variant="outline">{type}</Badge>;
  }
  return (
    <Badge variant="outline" className={ACCOUNT_TYPE_CLASS[type]}>
      {t(ACCOUNT_TYPE_LABEL_KEYS[type])}
    </Badge>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "./money";
import { AccountTypeBadge } from "./account-type-badge";
import { AccountStatementTable } from "./account-statement-table";
import type {
  SerializedAccountBalance,
  SerializedAccountStatement,
} from "@/lib/ledger";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";

interface AccountDetailClientProps {
  balance: SerializedAccountBalance;
  firstPage: SerializedAccountStatement;
  locale: Locale;
}

export function AccountDetailClient({ balance, firstPage, locale }: AccountDetailClientProps) {
  const { account } = balance;
  const t = useT();

  const statementTitleKey =
    balance.lineCount === 1
      ? "ledger.account.detail.statement_with_count_one"
      : "ledger.account.detail.statement_with_count";

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{account.name}</h1>
          <AccountTypeBadge type={account.accountType} />
        </div>
        <code className="text-sm text-muted-foreground font-mono">{account.code}</code>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("ledger.account.detail.balance_label")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Money money={balance.balance} locale={locale} className="text-2xl" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("ledger.account.detail.total_debits")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Money money={balance.rawDebits} locale={locale} tone="muted" className="text-xl" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("ledger.account.detail.total_credits")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Money money={balance.rawCredits} locale={locale} tone="muted" className="text-xl" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t(statementTitleKey, { count: balance.lineCount })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AccountStatementTable
            accountCode={account.code}
            firstPage={firstPage}
            locale={locale}
          />
        </CardContent>
      </Card>
    </div>
  );
}

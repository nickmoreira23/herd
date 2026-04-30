"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "./money";
import { AccountTypeBadge } from "./account-type-badge";
import { AccountStatementTable } from "./account-statement-table";
import type {
  SerializedAccountBalance,
  SerializedAccountStatement,
} from "@/lib/ledger";

interface AccountDetailClientProps {
  balance: SerializedAccountBalance;
  firstPage: SerializedAccountStatement;
}

export function AccountDetailClient({ balance, firstPage }: AccountDetailClientProps) {
  const { account } = balance;

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo atual</CardTitle>
          </CardHeader>
          <CardContent>
            <Money money={balance.balance} className="text-2xl" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de débitos</CardTitle>
          </CardHeader>
          <CardContent>
            <Money money={balance.rawDebits} tone="muted" className="text-xl" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de créditos</CardTitle>
          </CardHeader>
          <CardContent>
            <Money money={balance.rawCredits} tone="muted" className="text-xl" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Extrato — {balance.lineCount} {balance.lineCount === 1 ? "linha" : "linhas"}</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountStatementTable accountCode={account.code} firstPage={firstPage} />
        </CardContent>
      </Card>
    </div>
  );
}

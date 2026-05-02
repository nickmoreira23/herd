import { connection } from "next/server";
import { listAccountsWithBalance, serializeAccountBalance } from "@/lib/ledger";
import { AccountsListClient } from "@/components/ledger/accounts-list-client";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function LedgerLandingPage() {
  await connection();
  const [balances, locale] = await Promise.all([
    listAccountsWithBalance({ includeArchived: false }),
    getLocale(),
  ]);
  const serialized = balances.map(serializeAccountBalance);
  return <AccountsListClient initialData={serialized} locale={locale} />;
}

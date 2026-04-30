import { connection } from "next/server";
import { listAccountsWithBalance, serializeAccountBalance } from "@/lib/ledger";
import { AccountsListClient } from "@/components/ledger/accounts-list-client";

export default async function LedgerLandingPage() {
  await connection();
  const balances = await listAccountsWithBalance({ includeArchived: false });
  const serialized = balances.map(serializeAccountBalance);
  return <AccountsListClient initialData={serialized} />;
}

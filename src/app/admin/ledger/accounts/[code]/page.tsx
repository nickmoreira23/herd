import { connection } from "next/server";
import { notFound } from "next/navigation";
import {
  getAccountBalance,
  getAccountStatement,
  serializeAccountBalance,
  serializeAccountStatement,
  AccountNotFoundError,
} from "@/lib/ledger";
import type { AccountBalance, AccountStatement } from "@/lib/ledger";
import { AccountDetailClient } from "@/components/ledger/account-detail-client";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  await connection();
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);

  let balance: AccountBalance;
  let firstPage: AccountStatement;
  try {
    [balance, firstPage] = await Promise.all([
      getAccountBalance(decodedCode),
      getAccountStatement({ accountCode: decodedCode, limit: 50 }),
    ]);
  } catch (e) {
    if (e instanceof AccountNotFoundError) notFound();
    throw e;
  }

  const locale = await getLocale();

  return (
    <AccountDetailClient
      balance={serializeAccountBalance(balance)}
      firstPage={serializeAccountStatement(firstPage)}
      locale={locale}
    />
  );
}

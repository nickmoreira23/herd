import { connection } from "next/server";
import { listRecentEntries, serializeRecentEntry } from "@/lib/ledger";
import { EntriesListClient } from "@/components/ledger/entries-list-client";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function LedgerEntriesPage() {
  await connection();
  const [entries, locale] = await Promise.all([
    listRecentEntries({ limit: 100 }),
    getLocale(),
  ]);
  const serialized = entries.map(serializeRecentEntry);
  return <EntriesListClient initialData={serialized} locale={locale} />;
}

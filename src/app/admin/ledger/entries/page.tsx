import { connection } from "next/server";
import { listRecentEntries, serializeRecentEntry } from "@/lib/ledger";
import { EntriesListClient } from "@/components/ledger/entries-list-client";

export default async function LedgerEntriesPage() {
  await connection();
  const entries = await listRecentEntries({ limit: 100 });
  const serialized = entries.map(serializeRecentEntry);
  return <EntriesListClient initialData={serialized} />;
}

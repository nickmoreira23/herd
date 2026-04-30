import { connection } from "next/server";
import { notFound } from "next/navigation";
import {
  getEntryDetails,
  serializeEntryDetails,
  EntryNotFoundError,
} from "@/lib/ledger";
import { EntryDetailClient } from "@/components/ledger/entry-detail-client";
import type { EntryDetails } from "@/lib/ledger";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  let entry: EntryDetails;
  try {
    entry = await getEntryDetails(id);
  } catch (e) {
    if (e instanceof EntryNotFoundError) notFound();
    throw e;
  }

  const locale = await getLocale();

  return <EntryDetailClient entry={serializeEntryDetails(entry)} locale={locale} />;
}

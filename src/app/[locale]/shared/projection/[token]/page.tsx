import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SharedProjectionView } from "@/components/financials/shared-projection-view";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";

export default async function SharedProjectionPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isSupportedLocale(locale)) notFound();

  return (
    <Suspense>
      <SharedProjectionView token={token} locale={locale as Locale} />
    </Suspense>
  );
}

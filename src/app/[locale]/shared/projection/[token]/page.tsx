import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SharedProjectionView } from "@/components/financials/shared-projection-view";
import { ForceLightTheme } from "@/components/subscribe/force-light-theme";
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
      {/* A public share link always renders in light mode, regardless of the
          theme the owner had active when they generated it. */}
      <ForceLightTheme />
      <SharedProjectionView token={token} locale={locale as Locale} />
    </Suspense>
  );
}

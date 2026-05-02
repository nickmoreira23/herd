import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SharedPackageView } from "@/components/packages/shared-package-view";
import { isSupportedLocale } from "@/lib/i18n/locales";

async function SharedContent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharedPackageView token={token} />;
}

export default async function SharedPackagePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const resolved = await params;
  if (!isSupportedLocale(resolved.locale)) notFound();

  return (
    <Suspense>
      <SharedContent params={Promise.resolve({ token: resolved.token })} />
    </Suspense>
  );
}

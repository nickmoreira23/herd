import { Suspense } from "react";
import { notFound } from "next/navigation";
import "@/app/globals.css";
import { isSupportedLocale } from "@/lib/i18n/locales";

export default async function PublicFormLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <Suspense>{children}</Suspense>
      </div>
    </div>
  );
}

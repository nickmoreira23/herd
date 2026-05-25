import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { getLocale } from "@/lib/i18n/get-locale";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ComeçaAI",
  description: "Admin & Financial Engine for ComeçaAI subscription operations",
};

/**
 * Async island that resolves the locale and wraps children in the
 * `LocaleProvider`. Suspense'd by the layout so Next 16's prerenderer can
 * stream the static shell first.
 */
async function LocaleShell({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return <LocaleProvider locale={locale}>{children}</LocaleProvider>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      className={`dark ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
         * Fallback intentionally omits {children}. Including the children in
         * the fallback caused the prerenderer to evaluate them with the
         * default locale AND the suspended locale-aware tree at the same
         * time, which surfaced "uncached data outside <Suspense>" errors
         * for routes whose pages were Suspense-correct on their own. With
         * `null`, the body streams empty until LocaleShell resolves, then
         * the real tree (with the resolved locale) renders.
         */}
        <Suspense fallback={null}>
          <LocaleShell>{children}</LocaleShell>
        </Suspense>
      </body>
    </html>
  );
}

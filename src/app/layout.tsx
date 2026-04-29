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
  title: "HERD OS",
  description: "Admin & Financial Engine for HERD subscription operations",
};

// Dynamic locale island — wrapped in <Suspense> so the layout shell streams.
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
        <Suspense
          fallback={
            <LocaleProvider locale={DEFAULT_LOCALE}>{children}</LocaleProvider>
          }
        >
          <LocaleShell>{children}</LocaleShell>
        </Suspense>
      </body>
    </html>
  );
}

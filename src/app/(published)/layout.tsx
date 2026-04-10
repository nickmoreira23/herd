import { Suspense } from "react";
import { Inter } from "next/font/google";
import "../globals.css";
import { GA4Script } from "@/components/landing-page/analytics/ga4-script";
import { WebVitalsReporter } from "@/components/landing-page/analytics/web-vitals-reporter";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || "";

export default function PublishedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
      </head>
      <body className="min-h-screen bg-white text-zinc-900">
        <Suspense>{children}</Suspense>
        {GA4_ID && <GA4Script measurementId={GA4_ID} />}
        <WebVitalsReporter />
      </body>
    </html>
  );
}

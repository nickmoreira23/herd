import { notFound } from "next/navigation";
import Link from "next/link";
import { LocaleLink } from "@/components/i18n/locale-link";
import { isSupportedLocale } from "@/lib/i18n/locales";

export default async function ExploreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
          <LocaleLink href="/explore" className="font-semibold tracking-tight">
            Explore
          </LocaleLink>
          <nav className="text-sm text-muted-foreground flex items-center gap-4 ml-auto">
            {/* /admin is flat (cookie resolves locale), use plain Link */}
            <Link href="/admin" className="hover:text-foreground transition-colors">
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

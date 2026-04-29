import Link from "next/link";

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
          <Link href="/explore" className="font-semibold tracking-tight">
            Explore
          </Link>
          <nav className="text-sm text-muted-foreground flex items-center gap-4 ml-auto">
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

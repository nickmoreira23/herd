import { Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/layout/providers";
import { AdminShell } from "@/components/layout/admin-shell";
import { TopBar } from "@/components/layout/top-bar";
import { ThemeInitializer } from "@/components/layout/theme-initializer";
import { BrandKitProvider } from "@/components/layout/brand-kit-provider";
import { MainContent } from "@/components/layout/main-content";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <TooltipProvider>
        <ThemeInitializer />
        <BrandKitProvider />
        <Suspense>
          <AdminShell>
            <TopBar />
            <MainContent>{children}</MainContent>
          </AdminShell>
        </Suspense>
      </TooltipProvider>
    </Providers>
  );
}

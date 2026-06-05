import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getActor } from "@/lib/permissions";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import {
  resolveViewerPermissions,
  type ViewerPermissions,
} from "@/lib/permissions/resolve-viewer-permissions";
import { PermissionProvider } from "@/lib/permissions/permission-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/layout/providers";
import { AdminShell } from "@/components/layout/admin-shell";
import { TopBar } from "@/components/layout/top-bar";
import { ThemeInitializer } from "@/components/layout/theme-initializer";
import { BrandKitProvider } from "@/components/layout/brand-kit-provider";
import { MainContent } from "@/components/layout/main-content";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // R&P Fase 7b — the permission provider is seeded HERE (admin root) so it wraps
  // the AdminShell (nav). Effective org = x-org-id (proxy) ?? JWT activeOrgId; no
  // active org (platform/super_admin pages) → empty allow-set (super_admin bypasses
  // useCan anyway). FAIL-CLOSED: no session → empty.
  const session = await auth();
  let viewerPermissions: ViewerPermissions = { allowSet: [], orgRole: null, isSuperAdmin: false };
  if (session?.user) {
    const orgId = (await getOrgIdFromRequest()) ?? session.user.activeOrgId ?? null;
    const actor = await getActor(session);
    viewerPermissions =
      orgId && actor
        ? await resolveViewerPermissions(orgId, actor)
        : {
            allowSet: [],
            orgRole: null,
            isSuperAdmin: (session.user as { isSuperAdmin?: boolean }).isSuperAdmin === true,
          };
  }

  return (
    <Providers>
      <TooltipProvider>
        <ThemeInitializer />
        <BrandKitProvider />
        <PermissionProvider value={viewerPermissions}>
          <Suspense>
            <AdminShell>
              <TopBar />
              <MainContent>{children}</MainContent>
            </AdminShell>
          </Suspense>
        </PermissionProvider>
      </TooltipProvider>
    </Providers>
  );
}

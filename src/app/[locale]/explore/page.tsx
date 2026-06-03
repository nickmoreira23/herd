import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";
import { getViewerContext } from "@/lib/marketplace/visibility-helpers";
import { LocaleLink } from "@/components/i18n/locale-link";
import { isSupportedLocale } from "@/lib/i18n/locales";

/**
 * Async island. Wrapped in <Suspense> by the page so Next 16 can stream the
 * static shell first; otherwise the prerenderer aborts with "Uncached data
 * was accessed outside of <Suspense>".
 */
async function ExploreContent() {
  await connection();
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const viewer = await getViewerContext(userId);

  // Per-tenant storefront resolved by host (subdomain/customDomain). No org for
  // this host (e.g. apex) → there is no storefront to show.
  const orgId = await getOrgIdFromRequest();
  if (!orgId) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-semibold mb-2">No storefront here</h1>
        <p className="text-muted-foreground">
          This address isn&apos;t linked to an organization&apos;s marketplace.
        </p>
      </div>
    );
  }

  // RLS isolates by tenant; the status filter stays (public sees PUBLISHED only).
  const sections = await withTenant(orgId, () =>
    prisma.marketplaceSection.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { scopes: true },
    })
  );

  const visible = sections.filter((s) =>
    // Section is visible if at least one of its scopes is visible to the viewer
    // OR if it has no scopes (display anyway).
    s.scopes.length === 0 ||
    s.scopes.some((sc) => {
      const restrictedByType = sc.allowedProfileTypeIds.length > 0;
      const restrictedByRole = sc.allowedRoleIds.length > 0;
      if (!restrictedByType && !restrictedByRole) return true;
      if (
        restrictedByType &&
        viewer.profileTypeId &&
        sc.allowedProfileTypeIds.includes(viewer.profileTypeId)
      ) return true;
      if (
        restrictedByRole &&
        viewer.roleIds.some((r) => sc.allowedRoleIds.includes(r))
      ) return true;
      return false;
    })
  );

  if (visible.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-semibold mb-2">Nothing to explore yet</h1>
        <p className="text-muted-foreground">
          {userId
            ? "No sections are available for your profile right now."
            : "Sign in to see content tailored to your profile."}
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-1">Explore</h1>
      <p className="text-sm text-muted-foreground mb-8">
        {visible.length} section{visible.length === 1 ? "" : "s"} curated for you.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((s) => (
          <LocaleLink
            key={s.id}
            href={`/explore/${s.slug}`}
            className="group rounded-xl border bg-card hover:border-foreground/30 transition-colors overflow-hidden"
          >
            <div className="aspect-[16/9] bg-muted relative">
              {s.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.imageUrl}
                  alt={s.name}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <div className="p-4">
              <p className="font-semibold group-hover:text-foreground">{s.name}</p>
              {s.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {s.description}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
                {s.blockNames.length} block{s.blockNames.length === 1 ? "" : "s"}
              </p>
            </div>
          </LocaleLink>
        ))}
      </div>
    </>
  );
}

function ExploreSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-32 rounded bg-muted" />
      <div className="h-4 w-64 rounded bg-muted" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default async function ExploreIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Suspense fallback={<ExploreSkeleton />}>
        <ExploreContent />
      </Suspense>
    </div>
  );
}

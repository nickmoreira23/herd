import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getViewerContext } from "@/lib/marketplace/visibility-helpers";

export default async function ExploreIndexPage() {
  await connection();
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const viewer = await getViewerContext(userId);

  const sections = await prisma.marketplaceSection.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { scopes: true },
  });

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
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
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
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1">Explore</h1>
      <p className="text-sm text-muted-foreground mb-8">
        {visible.length} section{visible.length === 1 ? "" : "s"} curated for you.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((s) => (
          <Link
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
          </Link>
        ))}
      </div>
    </div>
  );
}

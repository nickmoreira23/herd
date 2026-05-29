import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { LocationsClient } from "@/components/locations/locations-client";
import type { LocationRow } from "@/components/locations/types";
import LocationsLoading from "./loading";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

async function LocationsContent() {
  await connection();
  const session = await auth();
  const orgId =
    (await getOrgIdFromRequest()) ?? session?.user?.activeOrgId ?? null;

  // Tenant leak guard: no active org → render empty (never withTenant("")).
  const locations = orgId
    ? await withTenant(orgId, () =>
        prisma.location.findMany({
          orderBy: [{ isHeadquarters: "desc" }, { name: "asc" }],
        })
      )
    : [];

  const serialized: LocationRow[] = locations.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));

  return <LocationsClient initialLocations={serialized} />;
}

export default function LocationsPage() {
  return (
    <Suspense fallback={<LocationsLoading />}>
      <LocationsContent />
    </Suspense>
  );
}

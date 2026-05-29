import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LocationDetailClient } from "@/components/locations/location-detail-client";
import type { LocationRow } from "@/components/locations/types";
import { auth } from "@/lib/auth";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  const orgId =
    (await getOrgIdFromRequest()) ?? session?.user?.activeOrgId ?? null;
  // Tenant leak guard: no active org → 404 (never withTenant("")).
  if (!orgId) notFound();

  const location = await withTenant(orgId, () =>
    prisma.location.findUnique({ where: { id } })
  );
  if (!location) notFound();

  const serialized: LocationRow = {
    ...location,
    createdAt: location.createdAt.toISOString(),
    updatedAt: location.updatedAt.toISOString(),
  };

  return <LocationDetailClient location={serialized} />;
}

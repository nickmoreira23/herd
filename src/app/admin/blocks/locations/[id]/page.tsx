import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LocationDetailClient } from "@/components/locations/location-detail-client";
import type { LocationRow } from "@/components/locations/types";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) notFound();

  const serialized: LocationRow = {
    ...location,
    createdAt: location.createdAt.toISOString(),
    updatedAt: location.updatedAt.toISOString(),
  };

  return <LocationDetailClient location={serialized} />;
}

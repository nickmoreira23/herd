import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { LocationsClient } from "@/components/locations/locations-client";
import type { LocationRow } from "@/components/locations/types";
import LocationsLoading from "./loading";
import { connection } from "next/server";

async function LocationsContent() {
  await connection();
  const locations = await prisma.location.findMany({
    orderBy: [{ isHeadquarters: "desc" }, { name: "asc" }],
  });

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

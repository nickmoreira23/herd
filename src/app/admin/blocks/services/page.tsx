import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ServicesClient } from "@/components/services/services-client";
import type { ServiceRow } from "@/components/services/types";
import ServicesLoading from "./loading";
import { connection } from "next/server";

async function ServicesContent() {
  await connection();
  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 500,
  });

  const serialized: ServiceRow[] = services.map((s) => ({
    ...s,
    contentJson: s.contentJson,
    price: s.price?.toString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return <ServicesClient initialServices={serialized} />;
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<ServicesLoading />}>
      <ServicesContent />
    </Suspense>
  );
}

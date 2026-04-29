import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ServiceDetailClient } from "@/components/services/service-detail-client";
import type { ServiceRow } from "@/components/services/types";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) notFound();

  const serialized: ServiceRow = {
    ...service,
    contentJson: service.contentJson,
    price: service.price?.toString() ?? null,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };

  return <ServiceDetailClient service={serialized} />;
}

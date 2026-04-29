import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExperienceDetailClient } from "@/components/experiences/experience-detail-client";
import type { ExperienceRow } from "@/components/experiences/types";

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exp = await prisma.experience.findUnique({ where: { id } });
  if (!exp) notFound();

  const serialized: ExperienceRow = {
    ...exp,
    price: exp.price?.toString() ?? null,
    contentJson: exp.contentJson,
    startDate: exp.startDate?.toISOString() ?? null,
    endDate: exp.endDate?.toISOString() ?? null,
    createdAt: exp.createdAt.toISOString(),
    updatedAt: exp.updatedAt.toISOString(),
  };

  return <ExperienceDetailClient experience={serialized} />;
}

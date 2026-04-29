import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ExperiencesClient } from "@/components/experiences/experiences-client";
import type { ExperienceRow } from "@/components/experiences/types";
import ExperiencesLoading from "./loading";
import { connection } from "next/server";

async function ExperiencesContent() {
  await connection();
  const experiences = await prisma.experience.findMany({
    orderBy: [{ startDate: "asc" }, { updatedAt: "desc" }],
    take: 500,
  });

  const serialized: ExperienceRow[] = experiences.map((e) => ({
    ...e,
    price: e.price?.toString() ?? null,
    contentJson: e.contentJson,
    startDate: e.startDate?.toISOString() ?? null,
    endDate: e.endDate?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return <ExperiencesClient initialExperiences={serialized} />;
}

export default function ExperiencesPage() {
  return (
    <Suspense fallback={<ExperiencesLoading />}>
      <ExperiencesContent />
    </Suspense>
  );
}

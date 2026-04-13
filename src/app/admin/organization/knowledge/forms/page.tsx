import { prisma } from "@/lib/prisma";
import { FormList } from "@/components/forms/form-list";
import { connection } from "next/server";

export default async function KnowledgeFormsPage() {
  await connection();
  const forms = await prisma.knowledgeForm.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = forms.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    slug: f.slug,
    formStatus: f.formStatus,
    status: f.status,
    isActive: f.isActive,
    errorMessage: f.errorMessage,
    chunkCount: f.chunkCount,
    thankYouMessage: f.thankYouMessage,
    accessMode: f.accessMode,
    maxResponses: f.maxResponses,
    responseCount: f.responseCount,
    startsAt: f.startsAt?.toISOString() ?? null,
    endsAt: f.endsAt?.toISOString() ?? null,
    templateKey: f.templateKey,
    processedAt: f.processedAt?.toISOString() ?? null,
    createdAt: f.createdAt.toISOString(),
  }));

  const stats = {
    total: forms.length,
    draft: forms.filter((f) => f.formStatus === "DRAFT").length,
    active: forms.filter((f) => f.formStatus === "ACTIVE").length,
    closed: forms.filter((f) => f.formStatus === "CLOSED").length,
    totalResponses: forms.reduce((sum, f) => sum + f.responseCount, 0),
  };

  return <FormList initialForms={serialized} initialStats={stats} />;
}

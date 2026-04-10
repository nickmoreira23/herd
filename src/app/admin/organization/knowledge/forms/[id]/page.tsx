import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormBuilder } from "@/components/knowledge/forms/builder/form-builder";

export default async function FormBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const form = await prisma.knowledgeForm.findUnique({
    where: { id },
    include: {
      sections: {
        include: { fields: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!form) notFound();

  const serialized = {
    id: form.id,
    name: form.name,
    description: form.description,
    slug: form.slug,
    formStatus: form.formStatus as string,
    status: form.status as string,
    isActive: form.isActive,
    errorMessage: form.errorMessage,
    chunkCount: form.chunkCount,
    thankYouMessage: form.thankYouMessage,
    accessMode: form.accessMode,
    maxResponses: form.maxResponses,
    responseCount: form.responseCount,
    startsAt: form.startsAt?.toISOString() ?? null,
    endsAt: form.endsAt?.toISOString() ?? null,
    templateKey: form.templateKey,
    processedAt: form.processedAt?.toISOString() ?? null,
    createdAt: form.createdAt.toISOString(),
    sections: form.sections.map((s) => ({
      id: s.id,
      formId: s.formId,
      title: s.title,
      description: s.description,
      sortOrder: s.sortOrder,
      fields: s.fields.map((f) => ({
        id: f.id,
        sectionId: f.sectionId,
        label: f.label,
        type: f.type as string,
        placeholder: f.placeholder,
        helpText: f.helpText,
        isRequired: f.isRequired,
        options: f.options as { choices: string[] } | null,
        validation: f.validation as Record<string, unknown> | null,
        conditionalLogic: f.conditionalLogic as {
          fieldId: string;
          operator: string;
          value?: unknown;
        } | null,
        sortOrder: f.sortOrder,
      })),
    })),
  };

  return <FormBuilder initialForm={serialized} />;
}

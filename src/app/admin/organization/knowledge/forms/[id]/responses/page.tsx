import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormResponsesTable } from "@/components/knowledge/forms/responses/form-responses-table";

export default async function FormResponsesPage({
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

  const responses = await prisma.knowledgeFormResponse.findMany({
    where: { formId: id },
    orderBy: { submittedAt: "desc" },
  });

  const serializedResponses = responses.map((r) => ({
    id: r.id,
    formId: r.formId,
    status: r.status,
    answers: r.answers as Record<string, unknown>,
    textContent: r.textContent,
    chunkCount: r.chunkCount,
    submitterName: r.submitterName,
    submitterEmail: r.submitterEmail,
    errorMessage: r.errorMessage,
    processedAt: r.processedAt?.toISOString() ?? null,
    submittedAt: r.submittedAt.toISOString(),
  }));

  const serializedSections = form.sections.map((s) => ({
    id: s.id,
    formId: s.formId,
    title: s.title,
    description: s.description,
    sortOrder: s.sortOrder,
    fields: s.fields.map((f) => ({
      id: f.id,
      sectionId: f.sectionId,
      label: f.label,
      type: f.type,
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
  }));

  return (
    <FormResponsesTable
      formId={id}
      formName={form.name}
      initialResponses={serializedResponses}
      sections={serializedSections}
    />
  );
}

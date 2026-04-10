import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicFormRenderer } from "@/components/knowledge/forms/public/public-form-renderer";
import { PublicFormClosed } from "@/components/knowledge/forms/public/public-form-closed";
import { PublicFormAccessGate } from "@/components/knowledge/forms/public/public-form-access-gate";

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const form = await prisma.knowledgeForm.findUnique({
    where: { slug },
    include: {
      sections: {
        include: { fields: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!form || form.formStatus === "DRAFT") notFound();

  // Check if closed
  if (form.formStatus === "CLOSED") {
    return <PublicFormClosed name={form.name} message="This form is no longer accepting responses." />;
  }

  // Check date constraints
  const now = new Date();
  if (form.startsAt && now < form.startsAt) {
    return <PublicFormClosed name={form.name} message="This form is not yet open for submissions." />;
  }
  if (form.endsAt && now > form.endsAt) {
    return <PublicFormClosed name={form.name} message="This form is no longer accepting submissions." />;
  }

  // Check max responses
  if (form.maxResponses && form.responseCount >= form.maxResponses) {
    return <PublicFormClosed name={form.name} message="This form has reached its maximum number of responses." />;
  }

  // Private form — show access gate
  if (form.accessMode === "PRIVATE") {
    return (
      <PublicFormAccessGate
        slug={slug}
        formName={form.name}
        formDescription={form.description}
        formData={{
          id: form.id,
          name: form.name,
          description: form.description,
          slug: form.slug,
          thankYouMessage: form.thankYouMessage,
          sections: form.sections.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            sortOrder: s.sortOrder,
            fields: s.fields.map((f) => ({
              id: f.id,
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
          })),
        }}
      />
    );
  }

  // Public form — render directly
  return (
    <PublicFormRenderer
      slug={slug}
      form={{
        id: form.id,
        name: form.name,
        description: form.description,
        slug: form.slug,
        thankYouMessage: form.thankYouMessage,
        sections: form.sections.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          sortOrder: s.sortOrder,
          fields: s.fields.map((f) => ({
            id: f.id,
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
        })),
      }}
    />
  );
}

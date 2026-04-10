import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
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

  if (!form) return apiError("Form not found", 404);

  // Check if form is available
  if (form.formStatus === "DRAFT") {
    return apiError("This form is not yet published", 404);
  }

  if (form.formStatus === "CLOSED") {
    return apiSuccess({
      closed: true,
      name: form.name,
      description: form.description,
    });
  }

  // Check date constraints
  const now = new Date();
  if (form.startsAt && now < form.startsAt) {
    return apiSuccess({
      closed: true,
      name: form.name,
      message: "This form is not yet open for submissions.",
    });
  }
  if (form.endsAt && now > form.endsAt) {
    return apiSuccess({
      closed: true,
      name: form.name,
      message: "This form is no longer accepting submissions.",
    });
  }

  // Check max responses
  if (form.maxResponses && form.responseCount >= form.maxResponses) {
    return apiSuccess({
      closed: true,
      name: form.name,
      message: "This form has reached its maximum number of responses.",
    });
  }

  // Return the form definition (excluding sensitive fields)
  return apiSuccess({
    id: form.id,
    name: form.name,
    description: form.description,
    accessMode: form.accessMode,
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
        options: f.options,
        validation: f.validation,
        conditionalLogic: f.conditionalLogic,
        sortOrder: f.sortOrder,
      })),
    })),
  });
}

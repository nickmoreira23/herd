import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await prisma.knowledgeForm.findUnique({
    where: { id },
    include: {
      sections: {
        include: { fields: true },
      },
    },
  });

  if (!form) return apiError("Form not found", 404);
  if (form.formStatus !== "DRAFT") {
    return apiError("Only draft forms can be published", 400);
  }

  // Validate form has at least one field
  const totalFields = form.sections.reduce((sum, s) => sum + s.fields.length, 0);
  if (totalFields === 0) {
    return apiError("Form must have at least one field before publishing", 400);
  }

  const updated = await prisma.knowledgeForm.update({
    where: { id },
    data: { formStatus: "ACTIVE" },
  });

  return apiSuccess(updated);
}

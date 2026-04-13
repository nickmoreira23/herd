import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await prisma.knowledgeForm.findUnique({ where: { id } });
  if (!form) return apiError("Form not found", 404);
  if (form.formStatus !== "ACTIVE") {
    return apiError("Only active forms can be closed", 400);
  }

  const updated = await prisma.knowledgeForm.update({
    where: { id },
    data: { formStatus: "CLOSED" },
  });

  return apiSuccess(updated);
}

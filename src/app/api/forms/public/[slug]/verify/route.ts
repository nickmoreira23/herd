import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { verifyFormAccessSchema } from "@/lib/validations/knowledge-form";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const form = await prisma.knowledgeForm.findUnique({ where: { slug } });
  if (!form) return apiError("Form not found", 404);

  if (form.accessMode !== "PRIVATE") {
    return apiSuccess({ verified: true });
  }

  const result = await parseAndValidate(request, verifyFormAccessSchema);
  if ("error" in result) return result.error;

  // Simple password comparison (stored as plain text for now; can upgrade to hashed)
  if (result.data.password !== form.accessPassword) {
    return apiError("Incorrect password", 401);
  }

  return apiSuccess({ verified: true });
}

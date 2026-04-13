import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { renderFormResponseText } from "@/lib/forms/form-text-renderer";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  const { id, responseId } = await params;

  const response = await prisma.knowledgeFormResponse.findFirst({
    where: { id: responseId, formId: id },
  });
  if (!response) return apiError("Response not found", 404);

  try {
    await prisma.knowledgeFormResponse.update({
      where: { id: responseId },
      data: { status: "PROCESSING" },
    });

    // Load form with fields for rendering
    const form = await prisma.knowledgeForm.findUnique({
      where: { id },
      include: {
        sections: {
          include: { fields: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!form) {
      await prisma.knowledgeFormResponse.update({
        where: { id: responseId },
        data: { status: "ERROR", errorMessage: "Form not found" },
      });
      return apiError("Form not found", 404);
    }

    const sections = form.sections.map((s) => ({
      title: s.title,
      fields: s.fields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        options: f.options as { choices: string[] } | null,
      })),
    }));

    const textContent = renderFormResponseText(
      form.name,
      sections,
      response.answers as Record<string, unknown>,
      response.submittedAt
    );

    await prisma.knowledgeFormResponse.update({
      where: { id: responseId },
      data: {
        status: "READY",
        textContent,
        chunkCount: Math.ceil(textContent.length / 1000),
        processedAt: new Date(),
      },
    });

    return apiSuccess({ processed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Processing failed";
    await prisma.knowledgeFormResponse.update({
      where: { id: responseId },
      data: { status: "ERROR", errorMessage: message },
    });
    return apiError(message, 500);
  }
}

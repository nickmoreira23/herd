import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await prisma.knowledgeForm.findUnique({ where: { id } });
  if (!form) return apiError("Form not found", 404);

  try {
    await prisma.knowledgeForm.update({
      where: { id },
      data: { status: "PROCESSING" },
    });

    // Aggregate all READY response textContent
    const responses = await prisma.knowledgeFormResponse.findMany({
      where: { formId: id, status: "READY" },
      orderBy: { submittedAt: "asc" },
      select: { textContent: true },
    });

    const textContent = responses
      .map((r) => r.textContent)
      .filter(Boolean)
      .join("\n\n---\n\n");

    await prisma.knowledgeForm.update({
      where: { id },
      data: {
        status: "READY",
        textContent: textContent || null,
        chunkCount: textContent ? Math.ceil(textContent.length / 1000) : 0,
        processedAt: new Date(),
      },
    });

    return apiSuccess({ processed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Processing failed";
    await prisma.knowledgeForm.update({
      where: { id },
      data: { status: "ERROR", errorMessage: message },
    });
    return apiError(message, 500);
  }
}

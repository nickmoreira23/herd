import { prisma } from "@/lib/prisma";
import { apiSuccess, parseAndValidate } from "@/lib/api-utils";
import { createKnowledgeDocumentSchema } from "@/lib/validators/documents";

export async function GET() {
  const documents = await prisma.knowledgeDocument.findMany({
    orderBy: { uploadedAt: "desc" },
  });

  const stats = {
    total: documents.length,
    pending: documents.filter((d) => d.status === "PENDING").length,
    processing: documents.filter((d) => d.status === "PROCESSING").length,
    ready: documents.filter((d) => d.status === "READY").length,
    error: documents.filter((d) => d.status === "ERROR").length,
    totalSize: documents.reduce((sum, d) => sum + d.fileSize, 0),
  };

  return apiSuccess({ documents, stats });
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createKnowledgeDocumentSchema);
  if ("error" in result) return result.error;

  const document = await prisma.knowledgeDocument.create({ data: result.data });
  return apiSuccess(document, 201);
}

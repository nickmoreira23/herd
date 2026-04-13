import { prisma } from "@/lib/prisma";
import { apiSuccess, parseAndValidate } from "@/lib/api-utils";
import { createDocumentSchema } from "@/lib/validators/document";

export async function GET() {
  const documents = await prisma.document.findMany({
    orderBy: { uploadedAt: "desc" },
  });
  return apiSuccess(documents);
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createDocumentSchema);
  if ("error" in result) return result.error;

  const document = await prisma.document.create({ data: result.data });
  return apiSuccess(document, 201);
}

import { prisma } from "@/lib/prisma";
import { apiSuccess, parseAndValidate } from "@/lib/api-utils";
import { reorderFormSectionsSchema } from "@/lib/validations/knowledge-form";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: _id } = await params;
  const result = await parseAndValidate(request, reorderFormSectionsSchema);
  if ("error" in result) return result.error;

  const updates = result.data.sectionIds.map((sectionId, index) =>
    prisma.knowledgeFormSection.update({
      where: { id: sectionId },
      data: { sortOrder: index },
    })
  );

  await prisma.$transaction(updates);

  return apiSuccess({ reordered: true });
}

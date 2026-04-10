import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateKnowledgeFolderSchema } from "@/lib/validators/knowledge-folder";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const folder = await prisma.knowledgeFolder.findUnique({
    where: { id },
    include: {
      documents: {
        orderBy: { uploadedAt: "desc" },
      },
      children: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          _count: { select: { documents: true, images: true, videos: true, audios: true, children: true } },
        },
      },
      _count: { select: { documents: true, images: true, videos: true, audios: true, children: true } },
    },
  });

  if (!folder) return apiError("Folder not found", 404);

  return apiSuccess(folder);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.knowledgeFolder.findUnique({ where: { id } });
  if (!existing) return apiError("Folder not found", 404);

  const result = await parseAndValidate(request, updateKnowledgeFolderSchema);
  if ("error" in result) return result.error;

  const { parentId, ...rest } = result.data;

  // Prevent circular references
  if (parentId !== undefined) {
    if (parentId === id) return apiError("A folder cannot be its own parent", 400);
    if (parentId) {
      // Check that the new parent is not a descendant of this folder
      const isDescendant = await checkIsDescendant(parentId, id);
      if (isDescendant) {
        return apiError("Cannot move folder into one of its own subfolders", 400);
      }
    }
  }

  const folder = await prisma.knowledgeFolder.update({
    where: { id },
    data: {
      ...rest,
      ...(parentId !== undefined ? { parentId } : {}),
    },
  });

  return apiSuccess(folder);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.knowledgeFolder.findUnique({
    where: { id },
    include: { _count: { select: { documents: true, images: true, videos: true, audios: true, children: true } } },
  });
  if (!existing) return apiError("Folder not found", 404);

  // Move documents in this folder (and subfolders) to root before deleting
  // The onDelete: SetNull on KnowledgeDocument.folder handles this automatically via Prisma cascade
  await prisma.knowledgeFolder.delete({ where: { id } });

  return apiSuccess({ deleted: true });
}

/**
 * Check if `targetId` is a descendant of `ancestorId`.
 * Prevents circular folder references.
 */
async function checkIsDescendant(
  targetId: string,
  ancestorId: string
): Promise<boolean> {
  let currentId: string | null = targetId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === ancestorId) return true;
    if (visited.has(currentId)) return false; // prevent infinite loops
    visited.add(currentId);

    const found: { parentId: string | null } | null =
      await prisma.knowledgeFolder.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
    currentId = found?.parentId ?? null;
  }

  return false;
}

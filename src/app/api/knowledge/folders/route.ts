import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createKnowledgeFolderSchema } from "@/lib/validators/knowledge-folder";
import { NextRequest } from "next/server";
import { KnowledgeFolderType } from "@prisma/client";

const VALID_FOLDER_TYPES: Record<string, KnowledgeFolderType> = {
  DOCUMENT: "DOCUMENT",
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  AUDIO: "AUDIO",
};

export async function GET(request: NextRequest) {
  const typeParam = request.nextUrl.searchParams.get("type")?.toUpperCase();
  const folderType = typeParam && VALID_FOLDER_TYPES[typeParam]
    ? VALID_FOLDER_TYPES[typeParam]
    : undefined;

  const folders = await prisma.knowledgeFolder.findMany({
    where: folderType ? { folderType } : undefined,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: { documents: true, images: true, videos: true, audios: true, children: true },
      },
    },
  });

  return apiSuccess(folders);
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createKnowledgeFolderSchema);
  if ("error" in result) return result.error;

  const { name, description, color, folderType, parentId } = result.data;

  // Validate parent exists if provided
  if (parentId) {
    const parent = await prisma.knowledgeFolder.findUnique({
      where: { id: parentId },
    });
    if (!parent) return apiError("Parent folder not found", 404);
  }

  const folder = await prisma.knowledgeFolder.create({
    data: { name, description, color, folderType, parentId },
  });

  return apiSuccess(folder, 201);
}

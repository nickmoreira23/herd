import { prisma } from "@/lib/prisma";
import { DocumentsListClient } from "@/components/documents/documents-list-client";
import { connection } from "next/server";

export default async function DocumentsPage() {
  await connection();
  const [documents, folders] = await Promise.all([
    prisma.knowledgeDocument.findMany({
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.knowledgeFolder.findMany({
      where: { folderType: "DOCUMENT" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { documents: true, images: true, videos: true, audios: true, children: true } },
      },
    }),
  ]);

  const serializedDocs = documents.map((d) => ({
    ...d,
    uploadedAt: d.uploadedAt.toISOString(),
    processedAt: d.processedAt?.toISOString() ?? null,
    updatedAt: undefined,
  }));

  const serializedFolders = folders.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: undefined,
  }));

  return (
    <DocumentsListClient
      initialDocuments={serializedDocs}
      initialFolders={serializedFolders}
    />
  );
}

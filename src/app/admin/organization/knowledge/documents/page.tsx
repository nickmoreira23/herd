import { prisma } from "@/lib/prisma";
import { DocumentTable } from "@/components/documents/document-table";
import { DocumentsEmpty } from "@/components/documents/documents-empty";
import { connection } from "next/server";

export default async function KnowledgeDocumentsPage() {
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

  if (documents.length === 0 && folders.length === 0) {
    return <DocumentsEmpty />;
  }

  return (
    <DocumentTable
      initialDocuments={serializedDocs}
      initialFolders={serializedFolders}
    />
  );
}

import { prisma } from "@/lib/prisma";
import { KnowledgeDocumentTable } from "@/components/knowledge/knowledge-document-table";
import { KnowledgeDocumentsEmpty } from "@/components/knowledge/knowledge-documents-empty";

export default async function KnowledgeDocumentsPage() {
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
    return <KnowledgeDocumentsEmpty />;
  }

  return (
    <KnowledgeDocumentTable
      initialDocuments={serializedDocs}
      initialFolders={serializedFolders}
    />
  );
}

import { prisma } from "@/lib/prisma";
import { ImageTable } from "@/components/images/image-table";
import { KnowledgeImagesEmpty } from "@/components/knowledge/images/knowledge-images-empty";
import { connection } from "next/server";

export default async function KnowledgeImagesPage() {
  await connection();
  const [images, folders] = await Promise.all([
    prisma.knowledgeImage.findMany({
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.knowledgeFolder.findMany({
      where: { folderType: "IMAGE" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { documents: true, images: true, videos: true, audios: true, children: true } },
      },
    }),
  ]);

  const serializedImages = images.map((i) => ({
    ...i,
    uploadedAt: i.uploadedAt.toISOString(),
    processedAt: i.processedAt?.toISOString() ?? null,
    updatedAt: undefined,
  }));

  const serializedFolders = folders.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: undefined,
  }));

  if (images.length === 0 && folders.length === 0) {
    return <KnowledgeImagesEmpty />;
  }

  return (
    <ImageTable
      initialImages={serializedImages}
      initialFolders={serializedFolders}
    />
  );
}

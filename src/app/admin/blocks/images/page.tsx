import { prisma } from "@/lib/prisma";
import { ImagesListClient } from "@/components/images/images-list-client";
import { connection } from "next/server";

export default async function ImagesPage() {
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

  return (
    <ImagesListClient
      initialImages={serializedImages}
      initialFolders={serializedFolders}
    />
  );
}

import { prisma } from "@/lib/prisma";
import { AudiosListClient } from "@/components/audios/audios-list-client";
import { connection } from "next/server";

export default async function AudiosPage() {
  await connection();
  const [audios, folders] = await Promise.all([
    prisma.knowledgeAudio.findMany({
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.knowledgeFolder.findMany({
      where: { folderType: "AUDIO" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { documents: true, images: true, videos: true, audios: true, children: true } },
      },
    }),
  ]);

  const serializedAudios = audios.map((a) => ({
    ...a,
    uploadedAt: a.uploadedAt.toISOString(),
    processedAt: a.processedAt?.toISOString() ?? null,
    updatedAt: undefined,
  }));

  const serializedFolders = folders.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: undefined,
  }));

  return (
    <AudiosListClient
      initialAudios={serializedAudios}
      initialFolders={serializedFolders}
    />
  );
}

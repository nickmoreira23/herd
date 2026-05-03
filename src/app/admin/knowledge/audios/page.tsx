import { prisma } from "@/lib/prisma";
import { AudioTable } from "@/components/audios/audio-table";
import { AudiosEmpty } from "@/components/audios/audios-empty";
import { connection } from "next/server";

export default async function KnowledgeAudiosPage() {
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

  if (audios.length === 0 && folders.length === 0) {
    return <AudiosEmpty />;
  }

  return (
    <AudioTable
      initialAudios={serializedAudios}
      initialFolders={serializedFolders}
    />
  );
}

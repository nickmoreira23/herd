import { prisma } from "@/lib/prisma";
import { KnowledgeVideoTable } from "@/components/knowledge/videos/knowledge-video-table";
import { KnowledgeVideosEmpty } from "@/components/knowledge/videos/knowledge-videos-empty";
import { connection } from "next/server";

export default async function KnowledgeVideosPage() {
  await connection();
  const [videos, folders] = await Promise.all([
    prisma.knowledgeVideo.findMany({
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.knowledgeFolder.findMany({
      where: { folderType: "VIDEO" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { documents: true, images: true, videos: true, audios: true, children: true } },
      },
    }),
  ]);

  const serializedVideos = videos.map((v) => ({
    ...v,
    uploadedAt: v.uploadedAt.toISOString(),
    processedAt: v.processedAt?.toISOString() ?? null,
    updatedAt: undefined,
  }));

  const serializedFolders = folders.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: undefined,
  }));

  if (videos.length === 0 && folders.length === 0) {
    return <KnowledgeVideosEmpty />;
  }

  return (
    <KnowledgeVideoTable
      initialVideos={serializedVideos}
      initialFolders={serializedFolders}
    />
  );
}

import { prisma } from "@/lib/prisma";
import { KnowledgeDashboard } from "@/components/knowledge/knowledge-dashboard";
import {
  KNOWLEDGE_BLOCKS_SETTING_KEY,
  DEFAULT_KNOWLEDGE_BLOCKS,
  KNOWLEDGE_TYPE_BLOCKS,
} from "@/lib/knowledge-commons/constants";
import { connection } from "next/server";

export default async function KnowledgePage() {
  await connection();

  // Fetch enabled blocks setting
  const setting = await prisma.setting.findUnique({
    where: { key: KNOWLEDGE_BLOCKS_SETTING_KEY },
  });
  const enabledBlocks = setting
    ? String(setting.value).split(",").filter(Boolean)
    : [...KNOWLEDGE_TYPE_BLOCKS];

  // Fetch counts for all block types in parallel
  const [
    documentCount,
    imageCount,
    videoCount,
    audioCount,
    tableCount,
    formCount,
    linkCount,
    feedCount,
    appCount,
  ] = await Promise.all([
    prisma.knowledgeDocument.count(),
    prisma.knowledgeImage.count(),
    prisma.knowledgeVideo.count(),
    prisma.knowledgeAudio.count(),
    prisma.knowledgeTable.count(),
    prisma.knowledgeForm.count(),
    prisma.knowledgeLink.count(),
    prisma.knowledgeRSSFeed.count(),
    prisma.knowledgeApp.count(),
  ]);

  const counts: Record<string, number> = {
    documents: documentCount,
    images: imageCount,
    videos: videoCount,
    audios: audioCount,
    tables: tableCount,
    forms: formCount,
    links: linkCount,
    feeds: feedCount,
    apps: appCount,
  };

  return <KnowledgeDashboard counts={counts} enabledBlocks={enabledBlocks} />;
}

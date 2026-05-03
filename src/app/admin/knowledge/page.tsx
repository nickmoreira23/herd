import { prisma } from "@/lib/prisma";
import { KnowledgeDashboard } from "@/components/knowledge/knowledge-dashboard";
import {
  KNOWLEDGE_BLOCKS_SETTING_KEY,
  KNOWLEDGE_TYPE_BLOCKS,
  parseKnowledgeBlocks,
} from "@/lib/knowledge-commons/constants";
import { connection } from "next/server";

export default async function KnowledgePage() {
  await connection();

  const knowledgeSetting = await prisma.setting.findUnique({
    where: { key: KNOWLEDGE_BLOCKS_SETTING_KEY },
  });
  const selected = parseKnowledgeBlocks(knowledgeSetting?.value);
  // Dashboard only renders KNOWLEDGE_TYPE_BLOCKS — filter at the boundary so
  // arbitrary blocks added via "Manage Sources" don't break it.
  const enabledBlocks = (KNOWLEDGE_TYPE_BLOCKS as readonly string[]).filter(
    (b) => selected.has(b)
  );

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

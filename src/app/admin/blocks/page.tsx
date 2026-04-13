import { prisma } from "@/lib/prisma";
import { AllBlocksPage } from "@/components/blocks/all-blocks-page";
import { BLOCK_CATEGORIES_SETTING_KEY, parseBlockCategories } from "@/lib/blocks/block-categories";
import { connection } from "next/server";

export default async function BlocksPage() {
  await connection();

  // Fetch categories setting
  const setting = await prisma.setting.findUnique({
    where: { key: BLOCK_CATEGORIES_SETTING_KEY },
  });
  const categories = parseBlockCategories(setting?.value);

  // Fetch counts for all block types in parallel
  const [
    pageCount,
    productCount,
    agentCount,
    partnerCount,
    perkCount,
    communityCount,
    meetingCount,
    eventCount,
    taskCount,
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
    prisma.landingPage.count(),
    prisma.product.count(),
    prisma.agent.count(),
    prisma.partnerBrand.count(),
    prisma.perk.count(),
    prisma.communityBenefit.count(),
    prisma.meeting.count(),
    prisma.calendarEvent.count(),
    prisma.task.count(),
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
    pages: pageCount,
    products: productCount,
    agents: agentCount,
    partners: partnerCount,
    perks: perkCount,
    community: communityCount,
    meetings: meetingCount,
    events: eventCount,
    tasks: taskCount,
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

  return <AllBlocksPage initialCategories={categories} counts={counts} />;
}

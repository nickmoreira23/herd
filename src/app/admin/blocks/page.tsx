import { prisma } from "@/lib/prisma";
import { AllBlocksPage } from "@/components/blocks/all-blocks-page";
import { BLOCK_CATEGORIES_SETTING_KEY, parseBlockCategories } from "@/lib/blocks/block-categories";
import { connection } from "next/server";
import { getOrgIdFromRequest } from "@/lib/tenant/get-org-from-request";
import { withTenant } from "@/lib/tenancy/context";

export default async function BlocksPage() {
  await connection();

  // Fetch categories setting
  const setting = await prisma.setting.findUnique({
    where: { key: BLOCK_CATEGORIES_SETTING_KEY },
  });
  const categories = parseBlockCategories(setting?.value);

  // L1a.2 — Product is tenant-scoped: its count is host-org scoped.
  const orgId = await getOrgIdFromRequest();

  // Fetch counts for all block types in parallel
  const [
    pageCount,
    productCount,
    agentCount,
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
    orgId ? withTenant(orgId, () => prisma.product.count()) : Promise.resolve(0),
    prisma.agent.count(),
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

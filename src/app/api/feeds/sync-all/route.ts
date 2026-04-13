import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

const FREQUENCY_MS: Record<string, number> = {
  HOURLY: 60 * 60 * 1000,
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
};

export async function POST(request: Request) {
  // Auth check for cron
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return apiError("Unauthorized", 401);
    }
  }

  const now = new Date();

  // Find all active feeds that are due for a check
  const feeds = await prisma.knowledgeRSSFeed.findMany({
    where: {
      isActive: true,
      status: { not: "PROCESSING" },
    },
    select: {
      id: true,
      frequency: true,
      lastCheckedAt: true,
    },
  });

  const dueFeeds = feeds.filter((feed) => {
    if (!feed.lastCheckedAt) return true;
    const intervalMs = FREQUENCY_MS[feed.frequency] || FREQUENCY_MS.DAILY;
    return now.getTime() - feed.lastCheckedAt.getTime() >= intervalMs;
  });

  // Fire-and-forget individual syncs
  const baseUrl = request.headers.get("origin") || request.headers.get("host") || "";
  const origin = baseUrl.startsWith("http") ? baseUrl : `http://${baseUrl}`;

  for (const feed of dueFeeds) {
    fetch(`${origin}/api/knowledge/feeds/${feed.id}/sync`, {
      method: "POST",
    }).catch(() => {});
  }

  return apiSuccess({
    totalFeeds: feeds.length,
    dueFeeds: dueFeeds.length,
    triggered: dueFeeds.map((f) => f.id),
  });
}

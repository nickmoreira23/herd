import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-utils";

export async function GET() {
  const [
    totalThreads,
    openThreads,
    closedThreads,
    totalMessages,
    channelStats,
  ] = await Promise.all([
    prisma.messageThread.count(),
    prisma.messageThread.count({ where: { status: "OPEN" } }),
    prisma.messageThread.count({ where: { status: "CLOSED" } }),
    prisma.message.count(),
    prisma.messageChannel.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        channelType: true,
        _count: { select: { threads: true } },
      },
    }),
  ]);

  return apiSuccess({
    totalThreads,
    openThreads,
    closedThreads,
    totalMessages,
    channels: channelStats,
  });
}

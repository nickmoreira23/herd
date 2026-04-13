import { prisma } from "@/lib/prisma";
import { MessagesInboxClient } from "@/components/messages/messages-inbox-client";
import { connection } from "next/server";
import type { StatCard } from "@/components/shared/block-list-page/types";

export default async function MessagesPage() {
  await connection();

  const [threads, totalThreads, openThreads, closedThreads, totalMessages] =
    await Promise.all([
      prisma.messageThread.findMany({
        orderBy: { lastMessageAt: "desc" },
        include: {
          channel: { select: { id: true, name: true, channelType: true } },
          contact: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          messages: {
            orderBy: { sentAt: "desc" },
            take: 1,
            select: { id: true, content: true, direction: true, sentAt: true },
          },
          _count: { select: { messages: true } },
        },
      }),
      prisma.messageThread.count(),
      prisma.messageThread.count({ where: { status: "OPEN" } }),
      prisma.messageThread.count({ where: { status: "CLOSED" } }),
      prisma.message.count(),
    ]);

  const stats: StatCard[] = [
    { label: "Total Threads", value: String(totalThreads) },
    { label: "Open", value: String(openThreads) },
    { label: "Closed", value: String(closedThreads) },
    { label: "Total Messages", value: String(totalMessages) },
  ];

  return <MessagesInboxClient initialThreads={threads as never} stats={stats} />;
}

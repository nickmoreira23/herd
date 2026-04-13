import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ThreadDetailClient } from "@/components/messages/thread-detail-client";
import { connection } from "next/server";

export default async function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  const thread = await prisma.messageThread.findUnique({
    where: { id },
    include: {
      channel: { select: { id: true, name: true, channelType: true } },
      contact: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      messages: {
        orderBy: { sentAt: "asc" },
      },
      _count: { select: { messages: true } },
    },
  });

  if (!thread) return notFound();

  return (
    <ThreadDetailClient
      thread={thread as never}
      initialMessages={thread.messages as never}
    />
  );
}

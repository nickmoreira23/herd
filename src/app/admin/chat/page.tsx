import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChatLayout } from "@/components/chat/chat-layout";
import { connection } from "next/server";

export default async function ChatPage() {
  await connection();
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const conversations = await prisma.chatConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      model: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, role: true, createdAt: true },
      },
    },
  });

  const serialized = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    model: c.model,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    lastMessage: c.messages[0]
      ? {
          content: c.messages[0].content.slice(0, 100),
          role: c.messages[0].role,
          createdAt: c.messages[0].createdAt.toISOString(),
        }
      : null,
  }));

  return <ChatLayout initialConversations={serialized} />;
}

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createConversationSchema } from "@/lib/validators/chat";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return apiError("Unauthorized", 401);

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

    const data = conversations.map((c) => ({
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

    return apiSuccess(data);
  } catch (e) {
    console.error("GET /api/chat/conversations error:", e);
    return apiError("Failed to load conversations", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return apiError("Unauthorized", 401);

    const result = await parseAndValidate(request, createConversationSchema);
    if ("error" in result) return result.error;

    const conversation = await prisma.chatConversation.create({
      data: {
        userId,
        model: result.data.model || "claude-sonnet-4-20250514",
      },
    });

    return apiSuccess(
      {
        id: conversation.id,
        title: conversation.title,
        model: conversation.model,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        lastMessage: null,
      },
      201
    );
  } catch (e) {
    console.error("POST /api/chat/conversations error:", e);
    return apiError("Failed to create conversation", 500);
  }
}

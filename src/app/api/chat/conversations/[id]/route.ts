import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateConversationSchema } from "@/lib/validators/chat";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return apiError("Unauthorized", 401);
    const { id } = await params;

    const conversation = await prisma.chatConversation.findUnique({
      where: { id, userId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) return apiError("Conversation not found", 404);

    return apiSuccess({
      id: conversation.id,
      title: conversation.title,
      model: conversation.model,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        model: m.model,
        sources: m.sources,
        artifacts: m.artifacts,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("GET /api/chat/conversations/[id] error:", e);
    return apiError("Failed to load conversation", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return apiError("Unauthorized", 401);
    const { id } = await params;

    const existing = await prisma.chatConversation.findUnique({
      where: { id, userId },
    });
    if (!existing) return apiError("Conversation not found", 404);

    const result = await parseAndValidate(request, updateConversationSchema);
    if ("error" in result) return result.error;

    const updated = await prisma.chatConversation.update({
      where: { id },
      data: {
        ...(result.data.title !== undefined && { title: result.data.title }),
        ...(result.data.model !== undefined && { model: result.data.model }),
      },
    });

    return apiSuccess({
      id: updated.id,
      title: updated.title,
      model: updated.model,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error("PATCH /api/chat/conversations/[id] error:", e);
    return apiError("Failed to update conversation", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return apiError("Unauthorized", 401);
    const { id } = await params;

    const existing = await prisma.chatConversation.findUnique({
      where: { id, userId },
    });
    if (!existing) return apiError("Conversation not found", 404);

    await prisma.chatConversation.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/chat/conversations/[id] error:", e);
    return apiError("Failed to delete conversation", 500);
  }
}

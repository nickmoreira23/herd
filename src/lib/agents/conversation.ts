import { prisma } from "@/lib/prisma";

// ─── Types ─────────────────────────────────────────────────────

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Find or Create Conversation ───────────────────────────────

/**
 * Find an existing conversation for this agent+user, or create one.
 * Uses the agentId FK on ChatConversation (no sentinel titles).
 */
export async function findOrCreateConversation(
  agentId: string,
  userId: string
): Promise<string> {
  // Look for existing conversation for this agent + user
  const existing = await prisma.chatConversation.findFirst({
    where: { agentId, userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (existing) return existing.id;

  // Create new conversation
  const created = await prisma.chatConversation.create({
    data: { agentId, userId },
    select: { id: true },
  });

  return created.id;
}

// ─── Load History ──────────────────────────────────────────────

/**
 * Load the last N messages from a conversation for Anthropic context.
 */
export async function loadHistory(
  conversationId: string,
  limit = 30
): Promise<HistoryMessage[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { role: true, content: true },
  });

  return messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}

// ─── Save Messages ─────────────────────────────────────────────

export async function saveUserMessage(
  conversationId: string,
  content: string
): Promise<void> {
  await prisma.chatMessage.create({
    data: { conversationId, role: "user", content },
  });
}

export async function saveAssistantMessage(
  conversationId: string,
  content: string,
  model: string
): Promise<void> {
  await prisma.chatMessage.create({
    data: { conversationId, role: "assistant", content, model },
  });

  // Touch conversation timestamp
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

// ─── Clear Conversation ────────────────────────────────────────

/**
 * Delete all messages and create a fresh conversation for the same agent+user.
 * Returns the new conversationId.
 */
export async function clearConversation(
  conversationId: string,
  agentId: string,
  userId: string
): Promise<string> {
  // Delete old conversation (cascade deletes messages)
  await prisma.chatConversation.delete({ where: { id: conversationId } });

  // Create fresh
  const fresh = await prisma.chatConversation.create({
    data: { agentId, userId },
    select: { id: true },
  });

  return fresh.id;
}

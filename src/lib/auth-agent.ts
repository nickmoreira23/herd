import { auth } from "@/lib/auth";

/**
 * Resolves the user ID from either:
 * 1. Internal agent headers (X-Internal-Agent + X-Agent-User-Id) — for agent-initiated requests
 * 2. Session auth — for normal user requests
 *
 * Returns the user ID or null if unauthenticated.
 */
export async function authOrAgent(
  request: Request
): Promise<string | null> {
  // Check for internal agent header first
  const agentHeader = request.headers.get("X-Internal-Agent");
  if (agentHeader === "herd-ai") {
    const agentUserId = request.headers.get("X-Agent-User-Id");
    if (agentUserId) return agentUserId;
  }

  // Fall back to session auth
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

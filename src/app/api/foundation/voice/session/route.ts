import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { getVoiceService } from "@/lib/foundation/voice";

/**
 * POST /api/foundation/voice/session
 *
 * Create a real-time voice mode session.
 * Returns WebSocket URL and token for client connection.
 *
 * Body: { voiceId?, systemPrompt?, language? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const voiceService = getVoiceService();

    const session = await voiceService.createVoiceSession({
      voiceId: body.voiceId,
      systemPrompt: body.systemPrompt,
      language: body.language,
    });

    // Track session creation
    await prisma.voiceJob.create({
      data: {
        operation: "voice_session",
        provider: "voice-mode",
        status: "completed",
        inputRef: session.id,
        sourceType: body.sourceType ?? "agent",
        sourceId: body.sourceId ?? null,
        completedAt: new Date(),
      },
    });

    return apiSuccess(session);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create voice session";
    return apiError(message, 500);
  }
}

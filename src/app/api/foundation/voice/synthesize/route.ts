import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { getVoiceService } from "@/lib/foundation/voice";

export const maxDuration = 120;

/**
 * POST /api/foundation/voice/synthesize
 *
 * Body: { text: string, voiceId?: string, model?: string, speed?: number, outputFormat?: string, sourceType?, sourceId? }
 *
 * Returns the synthesized audio as a binary response with appropriate content-type.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.text || typeof body.text !== "string") {
      return apiError("Missing 'text' in request body", 400);
    }

    if (body.text.length > 10000) {
      return apiError("Text exceeds 10,000 character limit", 400);
    }

    const voiceService = getVoiceService();

    const result = await voiceService.synthesize({
      text: body.text,
      voiceId: body.voiceId,
      model: body.model,
      speed: body.speed,
      outputFormat: body.outputFormat,
    });

    // Save to uploads if requested
    let outputUrl: string | null = null;
    if (body.save) {
      const ext = result.mimeType === "audio/mpeg" ? "mp3" : "wav";
      const filename = `tts-${Date.now()}.${ext}`;
      const uploadDir = join(process.cwd(), "public", "uploads", "voice");
      await mkdir(uploadDir, { recursive: true });
      const filePath = join(uploadDir, filename);
      await writeFile(filePath, result.audioBuffer);
      outputUrl = `/uploads/voice/${filename}`;
    }

    // Create job record
    await prisma.voiceJob.create({
      data: {
        operation: "synthesize",
        provider: result.provider,
        status: "completed",
        inputRef: body.text.slice(0, 200),
        audioDurationSec: result.duration,
        costCents: result.costCents,
        outputUrl,
        sourceType: body.sourceType ?? null,
        sourceId: body.sourceId ?? null,
        completedAt: new Date(),
      },
    });

    // Return audio directly if not saving
    if (body.returnJson) {
      return apiSuccess({
        mimeType: result.mimeType,
        duration: result.duration,
        provider: result.provider,
        outputUrl,
        size: result.audioBuffer.length,
      });
    }

    return new Response(new Uint8Array(result.audioBuffer), {
      headers: {
        "Content-Type": result.mimeType,
        "Content-Length": String(result.audioBuffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Synthesis failed";
    return apiError(message, 500);
  }
}

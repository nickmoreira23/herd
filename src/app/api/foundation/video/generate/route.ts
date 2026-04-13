import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { getVideoService } from "@/lib/foundation/video";

export const maxDuration = 600; // 10 minutes for generation + polling

/**
 * POST /api/foundation/video/generate
 *
 * Accepts JSON with generation parameters:
 *   { prompt, imageUrl?, duration?, provider?, avatarId?, voiceId?, voiceText? }
 *
 * Returns the generation result. Creates a VideoJob record for tracking.
 */
export async function POST(request: Request) {
  const job = await prisma.videoJob.create({
    data: {
      operation: "generate",
      provider: "pending",
      status: "processing",
    },
  });

  try {
    const body = await request.json();

    if (!body.prompt) {
      await prisma.videoJob.update({
        where: { id: job.id },
        data: { status: "failed", errorMessage: "Missing 'prompt'" },
      });
      return apiError("Missing 'prompt' in request body", 400);
    }

    const videoService = getVideoService();
    const result = await videoService.generate({
      prompt: body.prompt,
      imageUrl: body.imageUrl,
      duration: body.duration,
      resolution: body.resolution,
      aspectRatio: body.aspectRatio,
      avatarId: body.avatarId,
      voiceId: body.voiceId,
      voiceText: body.voiceText,
    });

    await prisma.videoJob.update({
      where: { id: job.id },
      data: {
        provider: result.provider,
        status: "completed",
        inputRef: body.prompt.slice(0, 500),
        resultJson: JSON.stringify(result),
        outputUrl: result.videoUrl,
        videoDurationSec: result.duration,
        costCents: result.costCents,
        completedAt: new Date(),
      },
    });

    return apiSuccess({ job: { id: job.id }, result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Video generation failed";

    await prisma.videoJob.update({
      where: { id: job.id },
      data: { status: "failed", errorMessage: message },
    });

    return apiError(message, 500);
  }
}

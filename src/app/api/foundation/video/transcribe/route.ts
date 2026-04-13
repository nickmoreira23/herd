import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { getVideoService } from "@/lib/foundation/video";

export const maxDuration = 600; // 10 minutes for large files

/**
 * POST /api/foundation/video/transcribe
 *
 * Accepts video via:
 *   - FormData with a "file" field
 *   - JSON with { url: string, options?: {...} }
 *
 * Returns the transcription result directly (synchronous).
 * Also creates a VideoJob record for tracking.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const videoService = getVideoService();

    let result;
    let inputRef: string | null = null;
    let sourceType: string | null = null;
    let sourceId: string | null = null;
    let tempPath: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      // ── File Upload ──
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return apiError("Missing 'file' field in form data", 400);
      }

      sourceType = (formData.get("sourceType") as string) ?? null;
      sourceId = (formData.get("sourceId") as string) ?? null;

      const tmpDir = join(tmpdir(), "herd-video");
      await mkdir(tmpDir, { recursive: true });
      tempPath = join(tmpDir, `upload-${Date.now()}-${file.name}`);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(tempPath, buffer);

      inputRef = file.name;
      result = await videoService.transcribe({
        source: { type: "file", path: tempPath },
      });
    } else {
      // ── JSON with URL ──
      const body = await request.json();
      if (!body.url) {
        return apiError("Missing 'url' in request body", 400);
      }

      sourceType = body.sourceType ?? null;
      sourceId = body.sourceId ?? null;
      inputRef = body.url;

      result = await videoService.transcribe({
        source: { type: "url", url: body.url },
        language: body.options?.language,
        model: body.options?.model,
        diarize: body.options?.diarize,
      });
    }

    // Create job record
    const job = await prisma.videoJob.create({
      data: {
        operation: "transcribe",
        provider: result.provider,
        status: "completed",
        inputRef,
        resultJson: JSON.stringify(result),
        videoDurationSec: result.duration,
        costCents: result.costCents,
        sourceType,
        sourceId,
        completedAt: new Date(),
      },
    });

    // Clean up temp file
    if (tempPath) {
      unlink(tempPath).catch(() => {});
    }

    return apiSuccess({ job: { id: job.id }, result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Video transcription failed";
    return apiError(message, 500);
  }
}

import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { transcribeVideo } from "@/lib/knowledge/video-transcriber";
import { existsSync } from "fs";
import path from "path";

// Allow up to 10 minutes for long videos
export const maxDuration = 600;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const video = await prisma.knowledgeVideo.findUnique({ where: { id } });
  if (!video) return apiError("Not found", 404);

  // Set status to PROCESSING
  await prisma.knowledgeVideo.update({
    where: { id },
    data: { status: "PROCESSING", errorMessage: null },
  });

  try {
    const filePath = path.join(process.cwd(), "public", video.fileUrl);

    if (!existsSync(filePath)) {
      throw new Error(
        `File not found on disk: ${video.fileUrl}. The file may have been moved or deleted.`
      );
    }

    const textContent = await transcribeVideo(filePath);

    const trimmed = textContent?.trim() ?? "";

    if (
      trimmed.length === 0 ||
      trimmed === "[No speech detected in this video]"
    ) {
      const updated = await prisma.knowledgeVideo.update({
        where: { id },
        data: {
          textContent: trimmed || "",
          chunkCount: 0,
          status: "READY",
          processedAt: new Date(),
          errorMessage:
            trimmed === "[No speech detected in this video]"
              ? "No speech was detected in this video."
              : "No transcript could be generated for this video.",
        },
      });
      return apiSuccess(updated);
    }

    const updated = await prisma.knowledgeVideo.update({
      where: { id },
      data: {
        textContent,
        chunkCount: Math.ceil(textContent.length / 1000),
        status: "READY",
        processedAt: new Date(),
      },
    });

    return apiSuccess(updated);
  } catch (e) {
    const rawMessage = e instanceof Error ? e.message : String(e);
    const errorMessage = formatErrorMessage(rawMessage, video.fileName);

    console.error(
      `[Knowledge] Video processing failed for "${video.name}" (${video.id}):`,
      e
    );

    await prisma.knowledgeVideo.update({
      where: { id },
      data: { status: "ERROR", errorMessage },
    });

    return apiError(errorMessage, 500);
  }
}

function formatErrorMessage(raw: string, fileName: string): string {
  if (raw.includes("ENOENT") || raw.includes("File not found")) {
    return `File not found on disk. Please re-upload "${fileName}".`;
  }
  if (raw.includes("ffprobe") || raw.includes("ffmpeg")) {
    return `Video processing requires ffmpeg. Please install ffmpeg on your system. (${raw})`;
  }
  if (raw.includes("DEEPGRAM_API_KEY")) {
    return raw;
  }
  if (raw.includes("EACCES") || raw.includes("permission")) {
    return `Permission denied when reading "${fileName}". Check file system permissions.`;
  }
  if (raw.includes("ENOMEM") || raw.includes("heap")) {
    return `"${fileName}" is too large to process in memory. Try a shorter video.`;
  }
  return `Failed to process "${fileName}": ${raw}`;
}

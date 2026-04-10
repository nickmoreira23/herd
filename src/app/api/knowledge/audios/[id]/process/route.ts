import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { transcribeAudio } from "@/lib/knowledge/audio-transcriber";
import { existsSync } from "fs";
import path from "path";

// Allow up to 10 minutes for long audio files
export const maxDuration = 600;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const audio = await prisma.knowledgeAudio.findUnique({ where: { id } });
  if (!audio) return apiError("Not found", 404);

  // Set status to PROCESSING
  await prisma.knowledgeAudio.update({
    where: { id },
    data: { status: "PROCESSING", errorMessage: null },
  });

  try {
    const filePath = path.join(process.cwd(), "public", audio.fileUrl);

    if (!existsSync(filePath)) {
      throw new Error(
        `File not found on disk: ${audio.fileUrl}. The file may have been moved or deleted.`
      );
    }

    const textContent = await transcribeAudio(filePath);

    const trimmed = textContent?.trim() ?? "";

    if (
      trimmed.length === 0 ||
      trimmed === "[No speech detected in this audio]"
    ) {
      const updated = await prisma.knowledgeAudio.update({
        where: { id },
        data: {
          textContent: trimmed || "",
          chunkCount: 0,
          status: "READY",
          processedAt: new Date(),
          errorMessage:
            trimmed === "[No speech detected in this audio]"
              ? "No speech was detected in this audio."
              : "No transcript could be generated for this audio.",
        },
      });
      return apiSuccess(updated);
    }

    const updated = await prisma.knowledgeAudio.update({
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
    const errorMessage = formatErrorMessage(rawMessage, audio.fileName);

    console.error(
      `[Knowledge] Audio processing failed for "${audio.name}" (${audio.id}):`,
      e
    );

    await prisma.knowledgeAudio.update({
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
    return `Audio processing requires ffmpeg. Please install ffmpeg on your system. (${raw})`;
  }
  if (raw.includes("DEEPGRAM_API_KEY")) {
    return raw;
  }
  if (raw.includes("EACCES") || raw.includes("permission")) {
    return `Permission denied when reading "${fileName}". Check file system permissions.`;
  }
  if (raw.includes("ENOMEM") || raw.includes("heap")) {
    return `"${fileName}" is too large to process in memory. Try a shorter audio file.`;
  }
  return `Failed to process "${fileName}": ${raw}`;
}

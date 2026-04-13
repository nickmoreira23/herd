import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { transcribeAudio } from "@/lib/audios/audio-transcriber";
import { existsSync } from "fs";
import path from "path";

// Allow up to 10 minutes for long meetings
export const maxDuration = 600;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) return apiError("Meeting not found", 404);
  if (!meeting.audioFileUrl) return apiError("No audio file to process", 400);

  // Set status to PROCESSING
  await prisma.meeting.update({
    where: { id },
    data: { status: "PROCESSING", errorMessage: null },
  });

  try {
    const filePath = path.join(process.cwd(), "public", meeting.audioFileUrl);

    if (!existsSync(filePath)) {
      throw new Error(
        `Audio file not found on disk: ${meeting.audioFileUrl}. The file may have been moved or deleted.`
      );
    }

    const transcript = await transcribeAudio(filePath);
    const trimmed = transcript?.trim() ?? "";

    if (
      trimmed.length === 0 ||
      trimmed === "[No speech detected in this audio]"
    ) {
      const updated = await prisma.meeting.update({
        where: { id },
        data: {
          transcript: trimmed || "",
          chunkCount: 0,
          status: "READY",
          processedAt: new Date(),
          errorMessage: trimmed === "[No speech detected in this audio]"
            ? "No speech was detected in this recording."
            : "No transcript could be generated.",
        },
        include: { participants: true },
      });
      return apiSuccess(updated);
    }

    const updated = await prisma.meeting.update({
      where: { id },
      data: {
        transcript,
        chunkCount: Math.ceil(transcript.length / 1000),
        status: "READY",
        processedAt: new Date(),
      },
      include: { participants: true },
    });

    return apiSuccess(updated);
  } catch (e) {
    const rawMessage = e instanceof Error ? e.message : String(e);
    const errorMessage = formatErrorMessage(rawMessage);

    console.error(
      `[Meetings] Processing failed for "${meeting.title}" (${meeting.id}):`,
      e
    );

    await prisma.meeting.update({
      where: { id },
      data: { status: "ERROR", errorMessage },
    });

    return apiError(errorMessage, 500);
  }
}

function formatErrorMessage(raw: string): string {
  if (raw.includes("ENOENT") || raw.includes("File not found")) {
    return "Audio file not found on disk. Please re-upload the recording.";
  }
  if (raw.includes("ffprobe") || raw.includes("ffmpeg")) {
    return `Audio processing requires ffmpeg. Please install ffmpeg on your system.`;
  }
  if (raw.includes("DEEPGRAM_API_KEY")) {
    return raw;
  }
  return `Failed to process recording: ${raw}`;
}

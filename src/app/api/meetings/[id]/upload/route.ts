import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAudioDuration } from "@/lib/audios/audio-transcriber";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "audio/webm": "WEBM",
  "audio/ogg": "OGG",
  "audio/mpeg": "MP3",
  "audio/mp3": "MP3",
  "audio/wav": "WAV",
  "audio/x-wav": "WAV",
  "audio/flac": "FLAC",
  "audio/aac": "AAC",
  "audio/mp4": "M4A",
  "audio/x-m4a": "M4A",
  "application/octet-stream": "",
};

const EXTENSION_TO_FILE_TYPE: Record<string, string> = {
  ".webm": "WEBM",
  ".ogg": "OGG",
  ".mp3": "MP3",
  ".wav": "WAV",
  ".flac": "FLAC",
  ".aac": "AAC",
  ".m4a": "M4A",
};

function resolveFileType(mimeType: string, fileName: string): string | null {
  const fromMime = ALLOWED_MIME_TYPES[mimeType];
  if (fromMime) return fromMime;

  const ext = path.extname(fileName).toLowerCase();
  return EXTENSION_TO_FILE_TYPE[ext] || null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) return apiError("Meeting not found", 404);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return apiError("No file provided", 400);

  const fileType = resolveFileType(file.type, file.name);
  if (!fileType) {
    return apiError(
      "Unsupported audio format. Allowed: WEBM, OGG, MP3, WAV, FLAC, AAC, M4A",
      400
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "meetings"
  );
  await mkdir(uploadDir, { recursive: true });

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${timestamp}_${safeName}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  // Extract duration
  let duration: number | null = null;
  try {
    duration = await getAudioDuration(filePath);
  } catch (e) {
    console.warn("[Meetings] Could not extract audio duration:", e);
  }

  const updated = await prisma.meeting.update({
    where: { id },
    data: {
      audioFileUrl: `/uploads/meetings/${fileName}`,
      audioFileSize: file.size,
      audioMimeType: file.type,
      duration,
      status: "PROCESSING",
    },
  });

  return apiSuccess(updated);
}

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAudioDuration } from "@/lib/knowledge/audio-transcriber";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "audio/mpeg": "MP3",
  "audio/mp3": "MP3",
  "audio/wav": "WAV",
  "audio/x-wav": "WAV",
  "audio/ogg": "OGG",
  "audio/flac": "FLAC",
  "audio/aac": "AAC",
  "audio/mp4": "M4A",
  "audio/x-m4a": "M4A",
  "application/octet-stream": "", // fallback — check extension
};

const EXTENSION_TO_FILE_TYPE: Record<string, string> = {
  ".mp3": "MP3",
  ".wav": "WAV",
  ".ogg": "OGG",
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

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return apiError("No file provided", 400);

  const fileType = resolveFileType(file.type, file.name);
  if (!fileType) {
    return apiError(
      "Unsupported file type. Allowed: MP3, WAV, OGG, FLAC, AAC, M4A",
      400
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "knowledge", "audios");
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
    console.warn("[Knowledge] Could not extract audio duration:", e);
  }

  return apiSuccess({
    fileName: file.name,
    fileUrl: `/uploads/knowledge/audios/${fileName}`,
    fileSize: file.size,
    mimeType: file.type,
    fileType,
    duration,
  });
}

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getVideoService } from "@/lib/foundation/video";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "video/mp4": "MP4",
  "video/quicktime": "MOV",
  "video/webm": "WEBM",
  "video/x-msvideo": "AVI",
  "application/octet-stream": "", // fallback — check extension
};

const EXTENSION_TO_FILE_TYPE: Record<string, string> = {
  ".mp4": "MP4",
  ".mov": "MOV",
  ".webm": "WEBM",
  ".avi": "AVI",
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
      "Unsupported file type. Allowed: MP4, MOV, WEBM, AVI",
      400
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "knowledge", "videos");
  await mkdir(uploadDir, { recursive: true });

  const thumbnailDir = path.join(process.cwd(), "public", "uploads", "knowledge", "videos", "thumbnails");
  await mkdir(thumbnailDir, { recursive: true });

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${timestamp}_${safeName}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  // Extract duration and thumbnail
  let duration: number | null = null;
  let thumbnailUrl: string | null = null;

  try {
    duration = await getVideoService().processing.getDuration(filePath);
  } catch (e) {
    console.warn("[Knowledge] Could not extract video duration:", e);
  }

  try {
    const thumbName = `${timestamp}_thumb.jpg`;
    const thumbPath = path.join(thumbnailDir, thumbName);
    await getVideoService().processing.extractThumbnail(filePath, thumbPath);
    thumbnailUrl = `/uploads/knowledge/videos/thumbnails/${thumbName}`;
  } catch (e) {
    console.warn("[Knowledge] Could not extract video thumbnail:", e);
  }

  return apiSuccess({
    fileName: file.name,
    fileUrl: `/uploads/knowledge/videos/${fileName}`,
    fileSize: file.size,
    mimeType: file.type,
    fileType,
    duration,
    thumbnailUrl,
  });
}

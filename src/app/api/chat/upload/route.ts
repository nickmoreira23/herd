import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-utils";
import { resolveAttachmentType } from "@/lib/agents/media-processor";

// ─── Allowed MIME types ────────────────────────────────────────

const ALLOWED_MIMES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Audio
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/flac",
  "audio/aac",
  "audio/mp4",
  "audio/x-m4a",
  // Video
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  // Documents
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// ─── Route Handler ─────────────────────────────────────────────

export async function POST(request: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("Unauthorized", 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("Expected multipart/form-data", 400);
  }

  const file = formData.get("file") as File | null;
  if (!file) return apiError("No file provided", 400);

  if (!ALLOWED_MIMES.has(file.type)) {
    return apiError(`Unsupported file type: ${file.type}`, 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return apiError(`File too large. Maximum size is 50 MB.`, 400);
  }

  const type = resolveAttachmentType(file.type);
  if (!type) return apiError(`Could not determine file type`, 400);

  // Save to local uploads directory
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${timestamp}_${safeName}`;
  const uploadDir = path.join(process.cwd(), "public/uploads/chat");

  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const fileUrl = `/uploads/chat/${fileName}`;

  return apiSuccess({
    type,
    fileName: file.name,
    fileUrl,
    fileSize: file.size,
    mimeType: file.type,
  });
}

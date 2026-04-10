import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
  "text/markdown": "MD",
  "text/csv": "CSV",
  "application/octet-stream": "", // fallback — check extension
};

const EXTENSION_TO_FILE_TYPE: Record<string, string> = {
  ".pdf": "PDF",
  ".docx": "DOCX",
  ".txt": "TXT",
  ".md": "MD",
  ".csv": "CSV",
};

function resolveFileType(mimeType: string, fileName: string): string | null {
  // Try MIME type first
  const fromMime = ALLOWED_MIME_TYPES[mimeType];
  if (fromMime) return fromMime;

  // Fallback to extension (handles .md arriving as application/octet-stream, etc.)
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
      "Unsupported file type. Allowed: PDF, DOCX, TXT, MD, CSV",
      400
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "knowledge");
  await mkdir(uploadDir, { recursive: true });

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${timestamp}_${safeName}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  return apiSuccess({
    fileName: file.name,
    fileUrl: `/uploads/knowledge/${fileName}`,
    fileSize: file.size,
    mimeType: file.type,
    fileType,
  });
}

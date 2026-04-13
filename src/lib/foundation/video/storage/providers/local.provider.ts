import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import type {
  VideoStorageProvider,
  VideoUploadInput,
  VideoUploadResult,
} from "../../types";
import { FFmpegVideoProcessor } from "../../processing";

// ─── MIME → File Type Mapping ───────────────────────────────────

const MIME_TO_FILE_TYPE: Record<string, string> = {
  "video/mp4": "MP4",
  "video/quicktime": "MOV",
  "video/webm": "WEBM",
  "video/x-msvideo": "AVI",
};

const EXTENSION_TO_FILE_TYPE: Record<string, string> = {
  ".mp4": "MP4",
  ".mov": "MOV",
  ".webm": "WEBM",
  ".avi": "AVI",
};

// ─── Local Storage Provider ─────────────────────────────────────

export class LocalVideoStorageProvider implements VideoStorageProvider {
  name = "Local Filesystem";
  slug = "local";

  private processor = new FFmpegVideoProcessor();

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async upload(input: VideoUploadInput): Promise<VideoUploadResult> {
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "knowledge",
      "videos"
    );
    const thumbnailDir = path.join(uploadDir, "thumbnails");
    await mkdir(uploadDir, { recursive: true });
    await mkdir(thumbnailDir, { recursive: true });

    const timestamp = Date.now();
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${timestamp}_${safeName}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, input.buffer);

    // Resolve file type
    const fileType = this.resolveFileType(input.mimeType, input.fileName);

    // Extract duration
    let duration: number | null = null;
    try {
      duration = await this.processor.getDuration(filePath);
    } catch (e) {
      console.warn("[Video/Storage] Could not extract video duration:", e);
    }

    // Extract thumbnail
    let thumbnailUrl: string | null = null;
    try {
      const thumbName = `${timestamp}_thumb.jpg`;
      const thumbPath = path.join(thumbnailDir, thumbName);
      await this.processor.extractThumbnail(filePath, thumbPath);
      thumbnailUrl = `/uploads/knowledge/videos/thumbnails/${thumbName}`;
    } catch (e) {
      console.warn("[Video/Storage] Could not extract video thumbnail:", e);
    }

    return {
      fileUrl: `/uploads/knowledge/videos/${fileName}`,
      thumbnailUrl,
      duration,
      fileSize: input.buffer.length,
      fileType,
    };
  }

  async delete(fileUrl: string): Promise<void> {
    const filePath = path.join(process.cwd(), "public", fileUrl);

    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // Also try to delete associated thumbnail
    const fileName = path.basename(fileUrl);
    const thumbName = fileName.replace(/^(\d+)_.*/, "$1_thumb.jpg");
    const thumbPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "knowledge",
      "videos",
      "thumbnails",
      thumbName
    );

    if (existsSync(thumbPath)) {
      try {
        await unlink(thumbPath);
      } catch {
        // ignore thumbnail cleanup errors
      }
    }
  }

  // ── Private ────────────────────────────────────────────────────

  private resolveFileType(mimeType: string, fileName: string): string {
    const fromMime = MIME_TO_FILE_TYPE[mimeType];
    if (fromMime) return fromMime;

    const ext = path.extname(fileName).toLowerCase();
    return EXTENSION_TO_FILE_TYPE[ext] || "MP4";
  }
}

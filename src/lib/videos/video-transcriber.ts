/**
 * @deprecated Use `@/lib/foundation/video` directly.
 *
 * This file is a backward-compatibility shim. All video processing
 * logic now lives in the video foundation service.
 */

import { getVideoService } from "@/lib/foundation/video";
import { formatTimestamp } from "@/lib/foundation/video/processing";

/** @deprecated Use getVideoService().processing.getDuration() */
export async function getVideoDuration(filePath: string): Promise<number> {
  return getVideoService().processing.getDuration(filePath);
}

/** @deprecated Use getVideoService().processing.extractThumbnail() */
export async function extractThumbnail(
  videoPath: string,
  outputPath: string
): Promise<void> {
  return getVideoService().processing.extractThumbnail(videoPath, outputPath);
}

/** @deprecated Use getVideoService().transcribeAndFormat() */
export async function transcribeVideo(filePath: string): Promise<string> {
  return getVideoService().transcribeAndFormat(filePath);
}

/**
 * Format a duration in seconds to a human-readable MM:SS or HH:MM:SS string.
 * @deprecated Use formatTimestamp from @/lib/foundation/video
 */
export { formatTimestamp as formatDuration };

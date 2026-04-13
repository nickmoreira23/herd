import { getVoiceService } from "@/lib/foundation/voice";

/**
 * Get the duration of an audio file in seconds using ffprobe.
 * Delegates to the centralized voice service.
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  return getVoiceService().processing.getDuration(filePath);
}

/**
 * Format seconds as HH:MM:SS or MM:SS.
 */
function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Transcribe an audio file using Deepgram with speaker diarization.
 * Delegates to the centralized voice service.
 *
 * Returns a timestamped transcript with speaker labels:
 *   [00:00:01 - Speaker 1] Hello and welcome to today's session.
 *   [00:00:05 - Speaker 2] Thanks for having me.
 */
export async function transcribeAudio(filePath: string): Promise<string> {
  return getVoiceService().transcribeAndFormat(filePath);
}

/**
 * Format a duration in seconds to a human-readable MM:SS or HH:MM:SS string.
 */
export { formatTimestamp as formatDuration };

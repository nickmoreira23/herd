import { readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import os from "os";

/**
 * Get the duration of a video in seconds using ffprobe.
 */
export async function getVideoDuration(filePath: string): Promise<number> {
  const ffmpeg = await import("fluent-ffmpeg");

  return new Promise((resolve, reject) => {
    ffmpeg.default.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to probe video: ${err.message}`));
        return;
      }
      resolve(metadata.format.duration ?? 0);
    });
  });
}

/**
 * Extract a thumbnail frame from a video at ~25% of its duration.
 * Saves as JPEG to the specified output path.
 */
export async function extractThumbnail(
  videoPath: string,
  outputPath: string
): Promise<void> {
  const ffmpeg = await import("fluent-ffmpeg");

  const duration = await getVideoDuration(videoPath);
  const seekTime = Math.max(0, duration * 0.25);

  return new Promise((resolve, reject) => {
    ffmpeg
      .default(videoPath)
      .seekInput(seekTime)
      .frames(1)
      .outputOptions(["-vf", "scale=640:-1"])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err: Error) =>
        reject(new Error(`Thumbnail extraction failed: ${err.message}`))
      )
      .run();
  });
}

/**
 * Extract audio from a video file to a compressed audio file.
 * Uses mono MP3 at 64kbps to minimize file size for transcription APIs.
 */
async function extractAudio(
  videoPath: string,
  outputPath: string
): Promise<void> {
  const ffmpeg = await import("fluent-ffmpeg");

  return new Promise((resolve, reject) => {
    ffmpeg
      .default(videoPath)
      .noVideo()
      .audioChannels(1)
      .audioBitrate("64k")
      .audioFrequency(16000)
      .format("mp3")
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err: Error) =>
        reject(new Error(`Audio extraction failed: ${err.message}`))
      )
      .run();
  });
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
 * Transcribe a video file using Deepgram with speaker diarization.
 *
 * Extracts audio from the video, sends it to Deepgram's Nova-2 model
 * with diarization enabled, and formats the result as a timestamped
 * transcript with speaker labels:
 *
 *   [00:00:01 - Speaker 1] Hello and welcome to today's session.
 *   [00:00:05 - Speaker 2] Thanks for having me.
 */
export async function transcribeVideo(filePath: string): Promise<string> {
  let deepgramKey = process.env.DEEPGRAM_API_KEY;

  // Fallback: read directly from .env if the env var is empty
  if (!deepgramKey) {
    try {
      const { readFileSync } = await import("fs");
      const { join } = await import("path");
      const envPath = join(process.cwd(), ".env");
      const envContent = readFileSync(envPath, "utf-8");
      const match = envContent.match(
        /^DEEPGRAM_API_KEY=["']?([^"'\n]+)["']?/m
      );
      if (match) deepgramKey = match[1];
    } catch {
      // ignore — will throw below
    }
  }

  if (!deepgramKey) {
    throw new Error(
      "Video transcription requires Deepgram API access. " +
        "Please set DEEPGRAM_API_KEY in your .env file to enable this feature."
    );
  }

  // Extract audio to temp file
  const tempAudioPath = path.join(
    os.tmpdir(),
    `herd-audio-${Date.now()}.mp3`
  );

  try {
    console.log("[Knowledge] Extracting audio from video...");
    await extractAudio(filePath, tempAudioPath);

    const audioBuffer = await readFile(tempAudioPath);
    const audioSizeMB = audioBuffer.length / (1024 * 1024);
    console.log(
      `[Knowledge] Audio extracted: ${audioSizeMB.toFixed(2)} MB. Sending to Deepgram...`
    );

    // Send to Deepgram
    const { DeepgramClient } = await import("@deepgram/sdk");
    const deepgram = new DeepgramClient({ apiKey: deepgramKey });

    const response = await deepgram.listen.v1.media.transcribeFile(
      audioBuffer,
      {
        model: "nova-3",
        smart_format: true,
        punctuate: true,
        diarize: true,
        utterances: true,
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (response as any).body ?? (response as any).result ?? response;

    if (!result) {
      throw new Error("Deepgram returned no result");
    }

    // Format transcript from utterances (preferred — includes speaker + timestamps)
    const utterances = result.results?.utterances;
    if (utterances && utterances.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lines = utterances.map((utterance: any) => {
        const timestamp = formatTimestamp(utterance.start);
        const speaker = `Speaker ${utterance.speaker !== undefined ? utterance.speaker + 1 : "?"}`;
        return `[${timestamp} - ${speaker}] ${utterance.transcript}`;
      });

      return lines.join("\n");
    }

    // Fallback: use channel alternatives if no utterances
    const channels = result.results?.channels;
    if (channels && channels.length > 0) {
      const words = channels[0].alternatives?.[0]?.words ?? [];

      if (words.length === 0) {
        return "[No speech detected in this video]";
      }

      // Group words by speaker
      const segments: { speaker: number; start: number; text: string }[] = [];
      let currentSpeaker = -1;
      let currentStart = 0;
      let currentText = "";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const word of words as any[]) {
        const speaker = word.speaker ?? 0;
        if (speaker !== currentSpeaker) {
          if (currentText) {
            segments.push({
              speaker: currentSpeaker,
              start: currentStart,
              text: currentText.trim(),
            });
          }
          currentSpeaker = speaker;
          currentStart = word.start;
          currentText = word.punctuated_word ?? word.word;
        } else {
          currentText += " " + (word.punctuated_word ?? word.word);
        }
      }
      if (currentText) {
        segments.push({
          speaker: currentSpeaker,
          start: currentStart,
          text: currentText.trim(),
        });
      }

      return segments
        .map(
          (seg) =>
            `[${formatTimestamp(seg.start)} - Speaker ${seg.speaker + 1}] ${seg.text}`
        )
        .join("\n");
    }

    return "[No speech detected in this video]";
  } finally {
    // Clean up temp audio file
    try {
      await unlink(tempAudioPath);
    } catch {
      // ignore cleanup errors
    }
  }
}

/**
 * Format a duration in seconds to a human-readable MM:SS or HH:MM:SS string.
 * Exported for use in UI components.
 */
export { formatTimestamp as formatDuration };

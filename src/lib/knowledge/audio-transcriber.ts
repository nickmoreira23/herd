import { readFile } from "fs/promises";

/**
 * Get the duration of an audio file in seconds using ffprobe.
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  const ffmpeg = await import("fluent-ffmpeg");

  return new Promise((resolve, reject) => {
    ffmpeg.default.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to probe audio: ${err.message}`));
        return;
      }
      resolve(metadata.format.duration ?? 0);
    });
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
 * Transcribe an audio file using Deepgram with speaker diarization.
 *
 * Sends the audio directly to Deepgram's Nova-3 model with diarization
 * enabled and formats the result as a timestamped transcript with speaker labels:
 *
 *   [00:00:01 - Speaker 1] Hello and welcome to today's session.
 *   [00:00:05 - Speaker 2] Thanks for having me.
 */
export async function transcribeAudio(filePath: string): Promise<string> {
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
      "Audio transcription requires Deepgram API access. " +
        "Please set DEEPGRAM_API_KEY in your .env file to enable this feature."
    );
  }

  const audioBuffer = await readFile(filePath);
  const audioSizeMB = audioBuffer.length / (1024 * 1024);
  console.log(
    `[Knowledge] Transcribing audio: ${audioSizeMB.toFixed(2)} MB. Sending to Deepgram...`
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
      return "[No speech detected in this audio]";
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

  return "[No speech detected in this audio]";
}

/**
 * Format a duration in seconds to a human-readable MM:SS or HH:MM:SS string.
 */
export { formatTimestamp as formatDuration };

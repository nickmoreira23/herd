import type { AudioProcessor, AudioExtractOptions } from "../types";

// ─── ffmpeg Audio Processor ──────────────────────────────────────

export class FFmpegAudioProcessor implements AudioProcessor {
  async getDuration(filePath: string): Promise<number> {
    const ffmpeg = await import("fluent-ffmpeg");

    return new Promise((resolve, reject) => {
      ffmpeg.default.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to probe media: ${err.message}`));
          return;
        }
        resolve(metadata.format.duration ?? 0);
      });
    });
  }

  async extractAudio(
    videoPath: string,
    outputPath: string,
    options?: AudioExtractOptions
  ): Promise<void> {
    const ffmpeg = await import("fluent-ffmpeg");
    const channels = options?.channels ?? 1;
    const bitrate = options?.bitrate ?? "64k";
    const sampleRate = options?.sampleRate ?? 16000;
    const format = options?.format ?? "mp3";

    return new Promise((resolve, reject) => {
      ffmpeg
        .default(videoPath)
        .noVideo()
        .audioChannels(channels)
        .audioBitrate(bitrate)
        .audioFrequency(sampleRate)
        .format(format)
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) =>
          reject(new Error(`Audio extraction failed: ${err.message}`))
        )
        .run();
    });
  }

  async convertFormat(
    inputPath: string,
    outputPath: string,
    format: string
  ): Promise<void> {
    const ffmpeg = await import("fluent-ffmpeg");

    return new Promise((resolve, reject) => {
      ffmpeg
        .default(inputPath)
        .format(format)
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) =>
          reject(new Error(`Format conversion failed: ${err.message}`))
        )
        .run();
    });
  }
}

import type { VideoProcessor, VideoAudioExtractOptions } from "../types";

// ─── FFmpeg Video Processor ─────────────────────────────────────

export class FFmpegVideoProcessor implements VideoProcessor {
  async getDuration(filePath: string): Promise<number> {
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

  async extractThumbnail(
    videoPath: string,
    outputPath: string
  ): Promise<void> {
    const ffmpeg = await import("fluent-ffmpeg");
    const duration = await this.getDuration(videoPath);
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

  async extractAudio(
    videoPath: string,
    outputPath: string,
    options?: VideoAudioExtractOptions
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

// ─── Formatting Utility ─────────────────────────────────────────

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

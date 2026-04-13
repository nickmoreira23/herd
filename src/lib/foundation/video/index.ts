import type {
  VideoTranscriptionInput,
  VideoTranscriptionResult,
  VideoGenerationInput,
  VideoGenerationResult,
} from "./types";
import { TranscriptionSubService } from "./transcription";
import { GenerationSubService } from "./generation";
import { FFmpegVideoProcessor } from "./processing";
import { StorageSubService } from "./storage";

// ─── Video Service Facade ───────────────────────────────────────
// Single entry point for all video capabilities.
// Consumed via getVideoService() singleton.

export class VideoService {
  readonly transcription: TranscriptionSubService;
  readonly generation: GenerationSubService;
  readonly processing: FFmpegVideoProcessor;
  readonly storage: StorageSubService;

  constructor() {
    this.transcription = new TranscriptionSubService();
    this.generation = new GenerationSubService();
    this.processing = new FFmpegVideoProcessor();
    this.storage = new StorageSubService();
  }

  // ── Transcription Convenience Methods ───────────────────────

  async transcribe(
    input: VideoTranscriptionInput
  ): Promise<VideoTranscriptionResult> {
    return this.transcription.transcribe(input);
  }

  async transcribeAndFormat(filePath: string): Promise<string> {
    return this.transcription.transcribeAndFormat(filePath);
  }

  // ── Generation Convenience Methods ──────────────────────────

  async generate(
    input: VideoGenerationInput
  ): Promise<VideoGenerationResult> {
    return this.generation.generate(input);
  }

  // ── Processing Convenience Methods ──────────────────────────

  async getDuration(filePath: string): Promise<number> {
    return this.processing.getDuration(filePath);
  }

  async extractThumbnail(
    videoPath: string,
    outputPath: string
  ): Promise<void> {
    return this.processing.extractThumbnail(videoPath, outputPath);
  }
}

// ─── Singleton ───────────────────────────────────────────────────

let instance: VideoService | null = null;

export function getVideoService(): VideoService {
  if (!instance) {
    instance = new VideoService();
  }
  return instance;
}

// Re-export types for consumer convenience
export type {
  VideoTranscriptionInput,
  VideoTranscriptionResult,
  VideoUtterance,
  VideoGenerationInput,
  VideoGenerationResult,
  VideoProcessor,
  VideoAudioExtractOptions,
  VideoStorageProvider,
  VideoUploadInput,
  VideoUploadResult,
  VideoConfig,
} from "./types";
export { formatTimestamp } from "./processing";
export { formatVideoTranscript } from "./transcription";

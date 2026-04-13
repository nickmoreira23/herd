import type { FoundationProvider } from "../types";

// ─── Video Transcription ────────────────────────────────────────

export interface VideoTranscriptionProvider extends FoundationProvider {
  transcribe(input: VideoTranscriptionInput): Promise<VideoTranscriptionResult>;
}

export interface VideoTranscriptionInput {
  source:
    | { type: "file"; path: string }
    | { type: "buffer"; data: Buffer; mimeType: string }
    | { type: "url"; url: string };
  language?: string;
  model?: string;
  diarize?: boolean;
}

export interface VideoTranscriptionResult {
  /** Full plain text */
  text: string;
  /** Speaker-diarized utterances with timestamps */
  utterances?: VideoUtterance[];
  /** Video duration in seconds */
  duration?: number;
  /** Overall confidence (0-1) */
  confidence?: number;
  /** Provider that produced this result */
  provider: string;
  /** Estimated cost in cents */
  costCents?: number;
}

export interface VideoUtterance {
  speaker: number;
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

// ─── Video Generation ───────────────────────────────────────────

export interface VideoGenerationProvider extends FoundationProvider {
  generate(input: VideoGenerationInput): Promise<VideoGenerationResult>;
}

export interface VideoGenerationInput {
  prompt: string;
  imageUrl?: string;
  duration?: number;
  resolution?: string;
  aspectRatio?: string;
  /** HeyGen-specific */
  avatarId?: string;
  voiceId?: string;
  voiceText?: string;
}

export interface VideoGenerationResult {
  videoUrl: string;
  duration?: number;
  provider: string;
  taskId?: string;
  costCents?: number;
}

// ─── Video Processing ───────────────────────────────────────────

export interface VideoProcessor {
  getDuration(filePath: string): Promise<number>;
  extractThumbnail(videoPath: string, outputPath: string): Promise<void>;
  extractAudio(
    videoPath: string,
    outputPath: string,
    options?: VideoAudioExtractOptions
  ): Promise<void>;
  convertFormat(
    inputPath: string,
    outputPath: string,
    format: string
  ): Promise<void>;
}

export interface VideoAudioExtractOptions {
  channels?: number;
  bitrate?: string;
  sampleRate?: number;
  format?: string;
}

// ─── Video Storage ──────────────────────────────────────────────

export interface VideoStorageProvider extends FoundationProvider {
  upload(input: VideoUploadInput): Promise<VideoUploadResult>;
  delete(fileUrl: string): Promise<void>;
}

export interface VideoUploadInput {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

export interface VideoUploadResult {
  fileUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  fileSize: number;
  fileType: string;
}

// ─── Video Service Configuration ────────────────────────────────

export interface VideoConfig {
  transcription: { primary: string; fallbacks?: string[] };
  generation: { primary: string; fallbacks?: string[] };
  storage: { primary: string; fallbacks?: string[] };
  defaults: {
    transcriptionModel: string;
    language: string;
    diarize: boolean;
    maxDurationSec: number;
    allowedFormats: string[];
  };
}

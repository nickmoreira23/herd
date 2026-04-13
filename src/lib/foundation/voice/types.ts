import type { FoundationProvider } from "../types";

// ─── Speech-to-Text (STT) ────────────────────────────────────────

export interface STTProvider extends FoundationProvider {
  transcribe(input: STTInput): Promise<STTResult>;
  transcribeStream?(stream: ReadableStream): AsyncIterable<STTPartialResult>;
}

export interface STTInput {
  source:
    | { type: "file"; path: string }
    | { type: "buffer"; data: Buffer; mimeType: string }
    | { type: "url"; url: string };
  language?: string;
  model?: string;
  diarize?: boolean;
  punctuate?: boolean;
  smartFormat?: boolean;
}

export interface STTResult {
  /** Full plain text */
  text: string;
  /** Speaker-diarized utterances with timestamps */
  utterances?: STTUtterance[];
  /** Audio duration in seconds */
  duration?: number;
  /** Detected language */
  language?: string;
  /** Overall confidence (0-1) */
  confidence?: number;
  /** Provider that produced this result */
  provider: string;
  /** Estimated cost in cents */
  costCents?: number;
}

export interface STTUtterance {
  speaker: number;
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface STTPartialResult {
  text: string;
  isFinal: boolean;
  speaker?: number;
}

// ─── Text-to-Speech (TTS) ────────────────────────────────────────

export interface TTSProvider extends FoundationProvider {
  synthesize(input: TTSInput): Promise<TTSResult>;
  synthesizeStream?(input: TTSInput): AsyncIterable<Buffer>;
  listVoices(): Promise<TTSVoice[]>;
}

export interface TTSInput {
  text: string;
  voiceId?: string;
  model?: string;
  speed?: number;
  outputFormat?: "mp3" | "wav" | "ogg" | "pcm";
}

export interface TTSResult {
  audioBuffer: Buffer;
  mimeType: string;
  duration?: number;
  provider: string;
  costCents?: number;
}

export interface TTSVoice {
  id: string;
  name: string;
  language?: string;
  gender?: string;
  previewUrl?: string;
  provider: string;
}

// ─── Voice Mode (Real-Time) ──────────────────────────────────────

export interface VoiceModeProvider extends FoundationProvider {
  createSession(config: VoiceModeConfig): Promise<VoiceModeSession>;
}

export interface VoiceModeConfig {
  voiceId?: string;
  systemPrompt?: string;
  language?: string;
  sttProvider?: string;
  ttsProvider?: string;
}

export interface VoiceModeSession {
  id: string;
  websocketUrl: string;
  token: string;
  expiresAt: Date;
}

// ─── Audio Processing ────────────────────────────────────────────

export interface AudioProcessor {
  getDuration(filePath: string): Promise<number>;
  extractAudio(
    videoPath: string,
    outputPath: string,
    options?: AudioExtractOptions
  ): Promise<void>;
  convertFormat(
    inputPath: string,
    outputPath: string,
    format: string
  ): Promise<void>;
}

export interface AudioExtractOptions {
  channels?: number;
  bitrate?: string;
  sampleRate?: number;
  format?: string;
}

// ─── Voice Service Configuration ─────────────────────────────────

export interface VoiceConfig {
  stt: { primary: string; fallbacks?: string[] };
  tts: { primary: string; fallbacks?: string[] };
  voiceMode: { primary: string; fallbacks?: string[] };
  defaults: {
    sttModel: string;
    sttLanguage: string;
    diarize: boolean;
    ttsVoiceId?: string;
    ttsOutputFormat: "mp3" | "wav" | "ogg" | "pcm";
  };
}

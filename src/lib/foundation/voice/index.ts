import type { STTInput, STTResult, TTSInput, TTSResult, TTSVoice, VoiceModeConfig, VoiceModeSession } from "./types";
import { STTSubService } from "./stt";
import { TTSSubService } from "./tts";
import { VoiceModeSubService } from "./voice-mode";
import { FFmpegAudioProcessor } from "./processing";

// ─── Voice Service Facade ────────────────────────────────────────
// Single entry point for all voice capabilities.
// Consumed via getVoiceService() singleton.

export class VoiceService {
  readonly stt: STTSubService;
  readonly tts: TTSSubService;
  readonly voiceMode: VoiceModeSubService;
  readonly processing: FFmpegAudioProcessor;

  constructor() {
    this.stt = new STTSubService();
    this.tts = new TTSSubService();
    this.voiceMode = new VoiceModeSubService();
    this.processing = new FFmpegAudioProcessor();
  }

  // ── STT Convenience Methods ──────────────────────────────────

  async transcribe(input: STTInput): Promise<STTResult> {
    return this.stt.transcribe(input);
  }

  async transcribeAndFormat(filePath: string): Promise<string> {
    return this.stt.transcribeAndFormat(filePath);
  }

  // ── TTS Convenience Methods ──────────────────────────────────

  async synthesize(input: TTSInput): Promise<TTSResult> {
    return this.tts.synthesize(input);
  }

  async listVoices(): Promise<TTSVoice[]> {
    return this.tts.listVoices();
  }

  // ── Voice Mode Convenience Methods ───────────────────────────

  async createVoiceSession(config: VoiceModeConfig): Promise<VoiceModeSession> {
    return this.voiceMode.createSession(config);
  }
}

// ─── Singleton ───────────────────────────────────────────────────

let instance: VoiceService | null = null;

export function getVoiceService(): VoiceService {
  if (!instance) {
    instance = new VoiceService();
  }
  return instance;
}

// Re-export types for consumer convenience
export type {
  STTInput,
  STTResult,
  STTUtterance,
  STTPartialResult,
  TTSInput,
  TTSResult,
  TTSVoice,
  VoiceModeConfig,
  VoiceModeSession,
  VoiceConfig,
  AudioProcessor,
  AudioExtractOptions,
} from "./types";
export { formatTranscript } from "./stt";

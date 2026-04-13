import type { BlockManifest } from "../manifest";

export const voiceBlock: BlockManifest = {
  name: "voice",
  displayName: "Voice",
  description:
    "Centralized voice service for speech-to-text transcription, text-to-speech synthesis, and real-time voice conversations. Supports multiple providers (Deepgram, ElevenLabs, Sesame) with automatic fallback.",
  domain: "foundation",
  types: ["voice_job"],
  capabilities: ["transcribe", "synthesize", "voice_mode"],
  models: ["VoiceJob", "FoundationServiceConfig"],
  dependencies: [],
  paths: {
    components: "src/components/foundations/voice/",
    pages: "src/app/admin/foundations/voice/",
    api: "src/app/api/foundation/voice/",
    lib: "src/lib/foundation/voice/",
  },
  actions: [
    {
      name: "transcribe_audio",
      description:
        "Transcribe an audio file or URL to text with speaker diarization. Returns structured result with utterances, timestamps, and speaker labels.",
      method: "POST",
      endpoint: "/api/foundation/voice/transcribe",
      parametersSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL of audio file to transcribe" },
          sourceType: { type: "string", description: "Source context (meeting, audio, agent)" },
          sourceId: { type: "string", description: "UUID of source entity" },
          options: {
            type: "object",
            properties: {
              language: { type: "string", description: "Language code (e.g., en, es)" },
              model: { type: "string", description: "Transcription model (e.g., nova-3)" },
              diarize: { type: "boolean", description: "Enable speaker diarization" },
            },
          },
        },
        required: ["url"],
      },
      requiredFields: ["url"],
      responseDescription:
        "Transcription result with full text, speaker-diarized utterances with timestamps, and job tracking ID",
    },
    {
      name: "synthesize_speech",
      description:
        "Convert text to speech audio using a selected voice. Returns audio data or saves to file.",
      method: "POST",
      endpoint: "/api/foundation/voice/synthesize",
      parametersSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to synthesize" },
          voiceId: { type: "string", description: "Voice ID to use" },
          speed: { type: "number", description: "Speech speed multiplier (0.5-2.0)" },
          save: { type: "boolean", description: "Save audio to uploads" },
          returnJson: { type: "boolean", description: "Return metadata instead of audio binary" },
        },
        required: ["text"],
      },
      requiredFields: ["text"],
      responseDescription: "Audio binary or metadata with file URL, duration, and provider info",
    },
    {
      name: "list_voices",
      description:
        "List all available text-to-speech voices across configured providers.",
      method: "GET",
      endpoint: "/api/foundation/voice/voices",
      parametersSchema: {
        type: "object",
        properties: {},
      },
      responseDescription:
        "Array of available voice options with names, languages, genders, and preview URLs",
    },
  ],
};

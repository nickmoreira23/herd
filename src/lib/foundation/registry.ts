import type { FoundationServiceMeta } from "./types";

// ─── Foundation Service Registry ──────────────────────────────────
// Central registry of all foundation services. Used by admin UI and sidebar.

export const foundationServices: FoundationServiceMeta[] = [
  {
    name: "voice",
    displayName: "Voice",
    description:
      "Speech-to-text, text-to-speech, and real-time voice capabilities.",
    status: "active",
    adminPath: "/admin/foundations/voice",
    capabilities: ["stt", "tts", "voice-mode", "audio-processing"],
  },
  {
    name: "video",
    displayName: "Video",
    description:
      "Video transcription, generation, processing, and storage.",
    status: "active",
    adminPath: "/admin/foundations/video",
    capabilities: ["transcription", "generation", "processing", "storage"],
  },
  {
    name: "payments",
    displayName: "Payments",
    description:
      "Centralized payment processing, subscriptions, and billing.",
    status: "coming-soon",
    adminPath: "/admin/foundations/payments",
    capabilities: ["checkout", "subscriptions", "invoicing"],
  },
  {
    name: "notifications",
    displayName: "Notifications",
    description:
      "Email, push, SMS, and in-app notification delivery.",
    status: "coming-soon",
    adminPath: "/admin/foundations/notifications",
    capabilities: ["email", "push", "sms", "in-app"],
  },
];

export function getFoundationService(
  name: string
): FoundationServiceMeta | undefined {
  return foundationServices.find((s) => s.name === name);
}

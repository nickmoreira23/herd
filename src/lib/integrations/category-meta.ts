import type { IntegrationCategory } from "@prisma/client";

export interface CategoryMeta {
  category: IntegrationCategory;
  slug: string;
  title: string;
  description: string;
  /** Whether this category surfaces a "Jobs" tab fed by VoiceJob/VideoJob. */
  jobsKind?: "voice" | "video";
}

export const CATEGORY_META: Record<IntegrationCategory, CategoryMeta> = {
  BILLING: {
    category: "BILLING",
    slug: "billing",
    title: "Billing",
    description: "Billing and invoicing integrations.",
  },
  PAYMENT: {
    category: "PAYMENT",
    slug: "payment",
    title: "Payment",
    description: "Payment processing integrations.",
  },
  CRM: {
    category: "CRM",
    slug: "crm",
    title: "CRM",
    description: "Customer relationship management integrations.",
  },
  ANALYTICS: {
    category: "ANALYTICS",
    slug: "analytics",
    title: "Analytics",
    description: "Analytics and reporting integrations.",
  },
  MARKETING: {
    category: "MARKETING",
    slug: "marketing",
    title: "Marketing",
    description: "Marketing automation and campaign integrations.",
  },
  COMMUNICATION: {
    category: "COMMUNICATION",
    slug: "communication",
    title: "Communication",
    description: "Email, messaging, and collaboration integrations.",
  },
  SUPPORT: {
    category: "SUPPORT",
    slug: "support",
    title: "Support",
    description: "Customer support and helpdesk integrations.",
  },
  MEETINGS: {
    category: "MEETINGS",
    slug: "meetings",
    title: "Meetings",
    description: "Video conferencing and meeting integrations.",
  },
  PROJECT_MANAGEMENT: {
    category: "PROJECT_MANAGEMENT",
    slug: "project-management",
    title: "Project Management",
    description: "Task and project management integrations.",
  },
  SOCIAL_MEDIA: {
    category: "SOCIAL_MEDIA",
    slug: "social-media",
    title: "Social Media",
    description: "Social media platform integrations.",
  },
  AI_MODELS: {
    category: "AI_MODELS",
    slug: "ai-models",
    title: "AI Models",
    description: "AI model provider integrations for text, image, video, and voice.",
  },
  VOICE: {
    category: "VOICE",
    slug: "voice",
    title: "Voice",
    description: "Speech-to-text, text-to-speech, and real-time voice capabilities.",
    jobsKind: "voice",
  },
  VIDEO: {
    category: "VIDEO",
    slug: "video",
    title: "Video",
    description: "Video transcription, generation, processing, and storage.",
    jobsKind: "video",
  },
  NOTIFICATIONS: {
    category: "NOTIFICATIONS",
    slug: "notifications",
    title: "Notifications",
    description: "Email, push, SMS, and in-app notification delivery.",
  },
  OTHER: {
    category: "OTHER",
    slug: "other",
    title: "Other",
    description: "Miscellaneous integrations and custom connections.",
  },
};

export const ALL_CATEGORIES: CategoryMeta[] = Object.values(CATEGORY_META);

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return ALL_CATEGORIES.find((c) => c.slug === slug);
}

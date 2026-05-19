import { IntegrationCategory } from "@prisma/client";
import type { IntegrationAdapter } from "../adapter.interface";
import type { IntegrationManifest } from "../manifest.schema";

/**
 * Recall.ai — meeting recording / transcription bots.
 *
 * Webhook delivery is via Svix; signature scheme is HMAC-SHA256 over
 * `${svix-id}.${svix-timestamp}.${body}` with the base64-decoded
 * `whsec_…` secret (Sub-etapa 5 `RecallWebhookVerifier`).
 *
 * Recall does NOT use `MemberConnection`-rooted tenant resolution — the
 * outbox handler reads `Meeting.externalBotId` directly (Meeting is not
 * in `TENANT_SCOPED_MODELS`). The manifest declares the capabilities
 * but the per-route tenant flow is documented in AGENTS.md.
 */
const recallManifest: IntegrationManifest = {
  // Slug aligned to DB / service in Sub-etapa 8.5 — `Integration` row uses
  // `recall-ai` and `RecallAiService.fromIntegration()` looks it up via that
  // same slug. The Sub-etapa 7 manifest had `recall` (without `-ai`) as a
  // working choice; the mismatch became blocking once the canonical pipeline
  // unified around the DB slug.
  slug: "recall-ai",
  name: "Recall.ai",
  category: IntegrationCategory.MEETINGS,
  capabilities: {
    supportsWebhooks: true,
    supportsOAuth: false,
    supportsHmacSignature: true,
    webhookEventsHaveStableId: true, // svix-id header is the stable id
  },
  webhookEvents: ["bot.status_change"],
  authType: "token",
  version: "1.0.0",
};

export const recallAdapter: IntegrationAdapter = {
  slug: recallManifest.slug,
  manifest: recallManifest,
};

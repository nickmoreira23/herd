import { IntegrationCategory } from "@prisma/client";
import type { IntegrationAdapter } from "../adapter.interface";
import type { IntegrationManifest } from "../manifest.schema";

/**
 * Gorgias — customer support ticketing (helpdesk).
 *
 * Currently provides inbound webhook ingestion via HMAC-SHA256 signature
 * verification (Sub-etapa 5) and the async outbox handler (Sub-etapa 6).
 * Member-level OAuth is not wired today — admin-level API token only.
 */
const gorgiasManifest: IntegrationManifest = {
  slug: "gorgias",
  name: "Gorgias",
  category: IntegrationCategory.SUPPORT,
  capabilities: {
    supportsWebhooks: true,
    supportsOAuth: false,
    supportsHmacSignature: true,
    webhookEventsHaveStableId: true, // payload.id is the dedup key (Sub-etapa 6)
  },
  // Subset surfaced by the Gorgias webhook integration today. Add entries
  // when handlers start branching on them; don't pre-register events we
  // don't yet route.
  webhookEvents: [
    "ticket.created",
    "ticket.updated",
    "customer.created",
    "customer.updated",
    "message.created",
  ],
  authType: "token",
  version: "1.0.0",
};

export const gorgiasAdapter: IntegrationAdapter = {
  slug: gorgiasManifest.slug,
  manifest: gorgiasManifest,
};

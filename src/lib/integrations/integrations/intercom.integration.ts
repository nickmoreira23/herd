import { IntegrationCategory } from "@prisma/client";
import type { IntegrationAdapter } from "../adapter.interface";
import type { IntegrationManifest } from "../manifest.schema";

/**
 * Intercom — customer messaging / live-chat / support hybrid.
 *
 * Categorized as COMMUNICATION here (not SUPPORT) because Intercom's
 * primary use in the platform is two-way customer messaging; SUPPORT
 * remains specific to ticket-centric helpdesks like Gorgias. This is a
 * UX-level distinction surfaced through `category-meta.ts` titles and
 * does not affect tenancy/security.
 */
const intercomManifest: IntegrationManifest = {
  slug: "intercom",
  name: "Intercom",
  category: IntegrationCategory.COMMUNICATION,
  capabilities: {
    supportsWebhooks: true,
    supportsOAuth: true, // Intercom OAuth Client Secret is the HMAC key
    supportsHmacSignature: true,
  },
  webhookEvents: [
    "conversation.user.created",
    "conversation.user.replied",
    "conversation.admin.replied",
    "conversation.admin.assigned",
    "contact.created",
    "contact.tag.created",
  ],
  authType: "oauth2",
  version: "1.0.0",
};

export const intercomAdapter: IntegrationAdapter = {
  slug: intercomManifest.slug,
  manifest: intercomManifest,
};

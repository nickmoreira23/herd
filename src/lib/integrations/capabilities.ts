import { z } from "zod";

/**
 * Sub-etapa 7 — Capability flags.
 *
 * Each capability is a coarse-grained yes/no that the orchestrator uses to
 * decide what to attempt with an integration without inspecting the adapter
 * class. Flags are intentionally additive: new capabilities get a new
 * optional flag rather than replacing/renaming existing ones.
 *
 * The starting set was derived from the 4 guinea-pig providers' real shape;
 * if a 5th adapter needs a flag not listed here, add it as `.optional()`
 * and document the trigger in AGENTS.md (avoid speculative "future" flags).
 */
export const CapabilityFlagsSchema = z.object({
  /** Provider sends inbound webhook deliveries we can subscribe to. */
  supportsWebhooks: z.boolean(),
  /** Member-level OAuth2 connect (vs platform-only admin credentials). */
  supportsOAuth: z.boolean(),
  /** Webhook signature can be HMAC/SHA-style verified (Sub-etapa 5). */
  supportsHmacSignature: z.boolean(),
  /** Provider hosts a self-serve billing/customer portal we can redirect to. */
  supportsBillingPortal: z.boolean().optional(),
  /** Provider exposes a sync endpoint for fetching plans/tiers. */
  supportsTierSync: z.boolean().optional(),
  /** Provider's webhook deliveries carry a stable per-event id (dedup-friendly). */
  webhookEventsHaveStableId: z.boolean().optional(),
});

export type CapabilityFlags = z.infer<typeof CapabilityFlagsSchema>;

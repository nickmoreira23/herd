import type { DomainEventHandler } from "./types";
import { gorgiasHandler } from "@/lib/webhooks/handlers/gorgias.handler";

/**
 * Maps event_type strings to their handler functions.
 *
 * Convention: event_type is "{aggregate}.{verb}" in lowercase, dot-separated.
 * Verbs may use hyphens for compound forms.
 *
 * Examples (will be added in Phase 2+):
 *   "transaction.paid"
 *   "transaction.refunded"
 *   "commission.computed"
 *   "claim.activated"
 *   "stage.completed"
 *
 * To add a handler:
 *   1. Implement the handler in src/lib/{domain}/handle-{event-type}.ts
 *   2. Import here.
 *   3. Add an entry to this object.
 *
 * Handlers MUST be idempotent — the worker may retry, and the same event may
 * be invoked multiple times for the same payload over the system's lifetime.
 *
 * Webhook handlers register a SINGLE entry per provider (e.g. "webhook.gorgias")
 * and dispatch internally on `payload.<provider>_event_type`. No wildcard
 * support in the registry — keep it as `Record<exact-string, handler>`.
 */
export const HANDLER_REGISTRY: Record<string, DomainEventHandler> = {
  // Webhook outbox handlers (Sub-etapa 6).
  // One entry per provider; sub-event dispatch lives inside the handler.
  "webhook.gorgias": gorgiasHandler,
};

export function getHandler(eventType: string): DomainEventHandler | null {
  return HANDLER_REGISTRY[eventType] ?? null;
}

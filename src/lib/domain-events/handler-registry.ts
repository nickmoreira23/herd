import type { DomainEventHandler } from "./types";

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
 */
export const HANDLER_REGISTRY: Record<string, DomainEventHandler> = {
  // Empty in Phase 1, Etapa 1.8.
  // Real handlers will be added when Phase 2 introduces Transaction.
};

export function getHandler(eventType: string): DomainEventHandler | null {
  return HANDLER_REGISTRY[eventType] ?? null;
}

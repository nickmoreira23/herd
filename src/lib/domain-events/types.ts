import type { DomainEvent } from "@prisma/client";

export type { DomainEvent };

/**
 * Input for emitting a new domain event.
 * `occurredAt` defaults to `new Date()` when not provided.
 */
export interface EmitDomainEventInput {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload?: Record<string, unknown>;
  idempotencyKey?: string;
  occurredAt?: Date;
}

/**
 * Result of processing one event by the worker.
 */
export interface ProcessEventResult {
  eventId: string;
  status: "succeeded" | "failed" | "no-handler" | "exhausted";
  attempts: number;
  errorMessage?: string;
}

/**
 * Result of a worker run.
 */
export interface WorkerRunResult {
  picked: number;
  succeeded: number;
  failed: number;
  noHandler: number;
  exhausted: number;
  results: ProcessEventResult[];
}

/**
 * A handler for a specific event type.
 * Receives the event and a Prisma client (which may be a TransactionClient if
 * the worker chooses to wrap handler execution in a transaction — which it
 * does NOT in the initial implementation, but the type is permissive for
 * future flexibility).
 *
 * Must be idempotent: workers may retry, and the same event may be invoked
 * multiple times for the same payload across the system's lifetime.
 *
 * Throws on failure. The worker captures the error message and increments
 * the event's attempt counter.
 */
export type DomainEventHandler = (
  event: DomainEvent,
  client: import("@prisma/client").PrismaClient
       | import("@prisma/client").Prisma.TransactionClient,
) => Promise<void>;

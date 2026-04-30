import type { PrismaClient, DomainEvent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ProcessEventResult, WorkerRunResult } from "./types";
import { computeNextAttempt, MAX_ATTEMPTS } from "./compute-next-attempt";
import { findPendingEvents } from "./find-pending-events";
import { getHandler } from "./handler-registry";

export interface ProcessPendingEventsOptions {
  /** Maximum events to process in this run. Default 100. */
  limit?: number;
  /** Override the current time, primarily for testing. */
  now?: () => Date;
}

/**
 * Picks up to `limit` pending events, runs their handlers, and updates each
 * event's status atomically per event.
 *
 * Each event is processed in its own transaction (allowing partial success
 * across the batch). Events without registered handlers are marked as
 * "no-handler" with processedAt set, so they don't retry forever.
 */
export async function processPendingEvents(
  options: ProcessPendingEventsOptions = {},
  client: PrismaClient = prisma,
): Promise<WorkerRunResult> {
  const limit = options.limit ?? 100;
  const now = options.now ?? (() => new Date());

  const result: WorkerRunResult = {
    picked: 0,
    succeeded: 0,
    failed: 0,
    noHandler: 0,
    exhausted: 0,
    results: [],
  };

  // Step 1: pick up to `limit` events under a single transaction. Lock them
  // via SKIP LOCKED so concurrent workers don't pick the same ones.
  const picked: DomainEvent[] = await client.$transaction(async (tx) => {
    return findPendingEvents(limit, tx);
  });

  result.picked = picked.length;
  if (picked.length === 0) return result;

  // Step 2: process each event in its own transaction. This is intentional —
  // we don't want one failing event to roll back the others.
  for (const event of picked) {
    const eventResult = await processOne(event, client, now);
    result.results.push(eventResult);
    if (eventResult.status === "succeeded") result.succeeded++;
    else if (eventResult.status === "failed") result.failed++;
    else if (eventResult.status === "no-handler") result.noHandler++;
    else if (eventResult.status === "exhausted") result.exhausted++;
  }

  return result;
}

async function processOne(
  event: DomainEvent,
  client: PrismaClient,
  now: () => Date,
): Promise<ProcessEventResult> {
  const handler = getHandler(event.eventType);

  if (!handler) {
    // No handler registered — mark as processed-with-no-handler so it doesn't
    // retry forever.
    await client.domainEvent.update({
      where: { id: event.id },
      data: {
        attempts: { increment: 1 },
        processedAt: now(),
        lastError: "No handler registered for eventType",
        nextAttemptAt: null,
      },
    });
    return {
      eventId: event.id,
      status: "no-handler",
      attempts: event.attempts + 1,
      errorMessage: "No handler registered",
    };
  }

  try {
    await handler(event, client);
    await client.domainEvent.update({
      where: { id: event.id },
      data: {
        attempts: { increment: 1 },
        processedAt: now(),
        lastError: null,
        nextAttemptAt: null,
      },
    });
    return {
      eventId: event.id,
      status: "succeeded",
      attempts: event.attempts + 1,
    };
  } catch (err) {
    const newAttempts = event.attempts + 1;
    const errorMessage = err instanceof Error ? err.message : String(err);
    const truncatedMessage = errorMessage.slice(0, 4096);

    if (newAttempts >= MAX_ATTEMPTS) {
      // Exhausted — no more retries.
      await client.domainEvent.update({
        where: { id: event.id },
        data: {
          attempts: newAttempts,
          lastError: truncatedMessage,
          nextAttemptAt: null,
        },
      });
      return {
        eventId: event.id,
        status: "exhausted",
        attempts: newAttempts,
        errorMessage: truncatedMessage,
      };
    }

    // Schedule next retry.
    const nextAt = computeNextAttempt(newAttempts, now());
    await client.domainEvent.update({
      where: { id: event.id },
      data: {
        attempts: newAttempts,
        lastError: truncatedMessage,
        nextAttemptAt: nextAt,
      },
    });
    return {
      eventId: event.id,
      status: "failed",
      attempts: newAttempts,
      errorMessage: truncatedMessage,
    };
  }
}

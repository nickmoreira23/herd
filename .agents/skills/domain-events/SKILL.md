---
name: domain-events-foundation
description: Working with HERD's domain events outbox pattern. Use this skill whenever the user mentions emitting events, event handlers, the domain_events table, retry policy, idempotency keys, or modifies code under src/lib/domain-events/. Read this BEFORE making any change to event emission, handler registration, or the worker. Do NOT use for unrelated event-like patterns (UI events, analytics events) — this skill is specifically about the domain events outbox.
license: Apache-2.0
title: Domain Events Outbox
phase: "1"
etapa: "1.9"
version: "1.0"
last_updated: "2026-04-30"
aggregates:
  - DomainEvent
status: stable
metadata:
  herd:
    classification_pending: unclassified
    target_path: .agents/skills/feature-foundation-domain-events/
    notes: "Migration to feature-{level}-{id}/ layout deferred to backfill etapa."
---

# Domain Events — Skill Reference

This document is the canonical reference for the domain events outbox that
underlies asynchronous communication between bounded contexts in HERD. It
encodes invariants, conventions, and patterns established in Phase 1, etapa
1.8. Read it before making any change that touches `src/lib/domain-events/`,
the `domain_events` table, or any code that emits or handles events.

## Mental model

Events are facts about state changes that have already happened. They are
emitted **inside the same transaction** that produced the state change,
guaranteeing transactional durability — events exist if and only if the
change exists.

The outbox is **eventually consistent**. The producer is synchronous (writes
event in transaction); processing is asynchronous (worker picks pending
events, runs handlers, marks status). Handlers see events in (roughly)
chronological order, but absolute global ordering across aggregates is not
guaranteed.

The outbox is **agnostic to business meaning**. It is generic infrastructure;
the business logic lives in handlers and in the consumers thereof.

## Core invariants

### Invariant 1: Events are emitted within a transaction

> `emitDomainEvent(input, client)` requires a `client` parameter — no default
> singleton. The client must be a `TransactionClient` from an open transaction,
> ensuring the event row is committed (or rolled back) atomically with the
> state change that produced it.

This is the core of the outbox pattern. No event without the change; no
change without the event. Singleton clients would allow events to drift from
the underlying state, so the API forbids that path.

```ts
await prisma.$transaction(async (tx) => {
  const transaction = await tx.transaction.create({ ... });
  await emitDomainEvent({
    aggregateType: "transaction",
    aggregateId: transaction.id,
    eventType: "transaction.paid",
    payload: { amount: transaction.amount },
  }, tx);
});
```

### Invariant 2: Idempotency by key

> When `emitDomainEvent` is called with an `idempotencyKey` that already
> exists, the equivalence check runs:
> - Same `aggregateType + aggregateId + eventType + payload` → returns the
>   existing event silently.
> - Anything different → throws `IdempotencyConflictError`.

Without an `idempotencyKey`, every call creates a new event row. Idempotency
is opt-in but recommended for any caller that may retry.

### Invariant 3: Events are immutable post-emission

> Once written, `aggregateType`, `aggregateId`, `eventType`, `payload`,
> `idempotencyKey`, `occurredAt`, and `createdAt` never change. Only
> `attempts`, `lastError`, `nextAttemptAt`, and `processedAt` are mutated by
> the worker.

Mutating event content would break audit trail. If a handler needs different
data, that's a new event — emit it, don't edit history.

### Invariant 4: Event types follow lowercase-dot-notation

> `eventType` strings use the format `{aggregate}.{verb}` in lowercase, with
> the dot as separator. Verbs may include hyphens for compound forms.

```
✓ transaction.paid
✓ commission.computed
✓ stage.completed
✓ account.balance-recomputed
✗ TransactionPaid
✗ transaction:paid
✗ transaction_paid
```

This convention keeps the namespace navigable and the registry keys
predictable.

### Invariant 5: Handlers must be idempotent

> A handler may be invoked multiple times for the same event. Workers may
> retry, workers may overlap (SKIP LOCKED reduces but does not eliminate the
> chance), and processing may resume from an unknown state after a crash.

Concretely: if a handler creates a row, it should `upsert` not blindly
`create`. If it sends an external message, it should check whether a previous
attempt already sent. If it modifies state, it should be safe under repeated
application.

The framework cannot enforce this — it is the handler author's responsibility.

### Invariant 6: Retry policy is bounded

> Failed events retry up to 5 times with exponential backoff
> `[1m, 5m, 30m, 2h]`. After exhaustion, `nextAttemptAt = NULL` and the
> event no longer auto-retries.

Defined in `src/lib/domain-events/compute-next-attempt.ts`. `MAX_ATTEMPTS = 5`.

Exhausted events require manual intervention — typically: investigate the
error in `lastError`, fix the handler bug or the data, then either
`UPDATE domain_events SET attempts = 0, nextAttemptAt = NULL WHERE id = ...`
to retry, or leave permanently exhausted (visible in audit).

### Invariant 7: No-handler events are consumed silently

> If an event arrives for an `eventType` not registered in `HANDLER_REGISTRY`,
> the worker marks it as `processedAt = now()`, `attempts = 1`,
> `lastError = "No handler registered..."`. It does not retry forever.

This treats a missing handler as "intentionally consumed and dropped" rather
than "system error". Reasoning: events for unhandled types may be legitimate
(legacy data, pending feature, dropped consumer) and looping forever burns
worker capacity.

If you need a no-handler event to retry once a handler exists, manually
reset it.

### Invariant 8: Workers coordinate via SKIP LOCKED

> The worker uses `SELECT ... FOR UPDATE SKIP LOCKED` to claim a batch of
> pending events. Multiple workers running concurrently never process the
> same event twice within a single picking phase.

The lock is released immediately after the batch is picked (the per-event
update transaction is the actual long-term coordinator). Handlers run outside
the picking lock so long-running handlers don't block other workers.

This means: a worker that crashes after picking but before update will leave
events as "still pending" — they'll be picked again by the next run. Combined
with Invariant 5 (idempotent handlers), this is safe.

### Invariant 9: Events have temporal vs physical timestamps

> `occurredAt` is the time the event happened in the domain (set by caller,
> defaults to `now()`).
>
> `createdAt` is the time the event row was inserted physically (set by DB,
> always `now()` of insertion).

Usually they are equal. They diverge in three cases: (a) backdated migration
of historical events, (b) emit-after-processing patterns, (c) deliberate
out-of-order replay. Worker queries the row by `occurredAt` ordering.

## Conventions

### Convention A: Standalone CLI worker

The worker runs as a standalone CLI (`npm run worker:domain-events`), not
as a background daemon. Reasons: (1) Railway/Supabase deploy targets don't
favor long-running processes, (2) batch model is easier to reason about,
(3) external scheduler (cron, Railway scheduled jobs) is the responsible
party for cadence.

The worker takes `--limit=N` to cap the batch size; default 100.

### Convention B: Handler registry is static

Handlers live in `src/lib/domain-events/handler-registry.ts` as entries in
`HANDLER_REGISTRY: Record<string, DomainEventHandler>`. Adding a handler is
two-step:

1. Implement the handler function (typically in
   `src/lib/{domain}/handle-{event-type}.ts`).
2. Import and register it in the registry.

Dynamic plugin loading is not supported and not on the roadmap.

### Convention C: Event payload is JSON-serializable

Payloads must be plain JSON objects — no `BigInt`, no `Date`, no class
instances. Convert at emit time:

```ts
await emitDomainEvent({
  // ...
  payload: {
    amountCents: amount.amountCents.toString(),  // bigint → string
    occurredAt: timestamp.toISOString(),         // Date → string
  },
}, tx);
```

Handlers parse back to typed values as needed.

### Convention D: Aggregate IDs are UUIDs

`aggregateId` must be a valid UUID string. The helper validates at emit time
and throws `RangeError` for invalid format. This keeps the audit trail
queryable by indexed UUID equality and prevents heterogeneous typing.

### Convention E: Worker errors are recoverable

A handler that throws produces:
- `attempts++`
- `lastError = err.message` (truncated to 4096 chars)
- `nextAttemptAt = computeNextAttempt(attempts)` (or null if exhausted)

The worker continues processing the next event. Per-event transactions
isolate failures.

## How to update this skill

Same procedure as the ledger SKILL: changelog section, version bump,
`last_updated`, deprecate-don't-delete on contradiction, update atomically
with the introducing etapa.

## Changelog

### v1.0 — 2026-04-30 (Etapa 1.9)
Initial publication, codifying invariants and conventions established in
Phase 1, etapa 1.8.

import type { JournalEntry, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/money";
import type { PostJournalLineInput } from "./types";
import { postJournalEntry } from "./post-journal-entry";
import { findReversalsOf } from "./find-reversals-of";
import {
  EntryNotFoundError,
  CannotReverseReversalError,
  EntryAlreadyReversedError,
  MissingReversalReasonError,
} from "./errors";

export interface ReverseJournalEntryOptions {
  /**
   * Required, non-empty explanation of why this entry is being reversed.
   * Stored on the new reversal entry's `description` AND in
   * `metadata.reversal.reason` for both human and structured queries.
   *
   * Reversals without context are an audit red flag — we force callers to
   * always document intent.
   */
  reason: string;

  /**
   * Optional idempotency key. Same semantics as `postJournalEntry` —
   * same key + equivalent payload returns the existing reversal silently;
   * same key + divergent payload throws `IdempotencyConflictError`.
   */
  idempotencyKey?: string;

  /**
   * Optional posting date. Defaults to `now()`. Use sparingly for backdated
   * adjustments.
   */
  postedAt?: Date;

  /**
   * Optional metadata. The service automatically merges
   * `{ reversal: { reason, originalEntryId, originalSourceKind, originalSourceId } }`
   * into whatever the caller passes. Caller's keys take precedence on
   * collision (which would be unusual).
   */
  metadata?: Record<string, unknown>;
}

/**
 * Creates a compensating journal entry that reverses the financial effect
 * of an existing entry. The original entry remains immutable; the new entry
 * has lines with directions flipped (D↔C) but identical accounts and amounts.
 *
 * Use cases:
 *   - Posted a wrong amount; need to undo and re-post correctly.
 *   - A transaction was refunded after the corresponding entry was settled.
 *   - Operational error correction.
 *
 * For partial undo (only some lines), do NOT use reversal — post a new
 * `postJournalEntry` with lines designed to produce the desired net effect.
 *
 * Throws:
 *   - `MissingReversalReasonError` if reason is empty/whitespace.
 *   - `EntryNotFoundError` if originalEntryId does not exist.
 *   - `CannotReverseReversalError` if the target entry has sourceKind=REVERSAL.
 *   - `EntryAlreadyReversedError` if the target has already been reversed.
 *   - Any error `postJournalEntry` may throw (account archived, unbalanced, etc.).
 */
export async function reverseJournalEntry(
  originalEntryId: string,
  options: ReverseJournalEntryOptions,
  client: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<JournalEntry> {
  // ---- Stage 1: option validation ----

  if (!options.reason || options.reason.trim().length === 0) {
    throw new MissingReversalReasonError();
  }

  // ---- Stage 2: load and validate the original entry ----

  const original = await client.journalEntry.findUnique({
    where: { id: originalEntryId },
    include: {
      lines: {
        include: { account: true },
      },
    },
  });

  if (!original) {
    throw new EntryNotFoundError(originalEntryId);
  }

  if (original.sourceKind === "REVERSAL") {
    throw new CannotReverseReversalError(originalEntryId, original.sourceId);
  }

  // ---- Stage 2.5: idempotency precheck ----
  // If a caller passed `idempotencyKey`, that key has precedence over the
  // EntryAlreadyReversed protection — the key is an explicit signal of "this
  // is a retry, not a new operation". We honor it before the double-reversal
  // guard so legitimate replays return the existing reversal silently.
  if (options.idempotencyKey) {
    const byKey = await client.journalEntry.findUnique({
      where: { idempotencyKey: options.idempotencyKey },
    });
    if (byKey) {
      // Case 1: key points to a reversal of THIS same original → legitimate replay.
      if (byKey.sourceKind === "REVERSAL" && byKey.sourceId === originalEntryId) {
        return byKey;
      }
      // Case 2: key exists but points elsewhere → let postJournalEntry detect
      // the conflict and raise IdempotencyConflictError with payload comparison,
      // which gives more useful context than anything we could throw here.
      // (falls through to the code below)
    }
  }

  const existingReversals = await findReversalsOf(originalEntryId, client);
  if (existingReversals.length > 0) {
    throw new EntryAlreadyReversedError(originalEntryId, existingReversals[0].id);
  }

  // ---- Stage 3: build the inverted lines ----

  const invertedLines: PostJournalLineInput[] = original.lines.map((line) => ({
    accountCode: line.account.code,
    direction: line.direction === "D" ? "C" : "D",
    amount: money(line.amountCents, line.currency as "BRL" | "USD"),
  }));

  // ---- Stage 4: build merged metadata with reversal trail ----

  const reversalMetadata = {
    reason: options.reason,
    originalEntryId: original.id,
    originalSourceKind: original.sourceKind,
    originalSourceId: original.sourceId,
  };

  const mergedMetadata: Record<string, unknown> = {
    reversal: reversalMetadata,
    ...(options.metadata ?? {}),
  };

  // ---- Stage 5: delegate to postJournalEntry ----

  const reversal = await postJournalEntry(
    {
      sourceKind: "REVERSAL",
      sourceId: original.id,
      description: options.reason,
      idempotencyKey: options.idempotencyKey,
      postedAt: options.postedAt,
      metadata: mergedMetadata,
      lines: invertedLines,
    },
    client,
  );

  return reversal;
}

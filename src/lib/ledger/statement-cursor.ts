import { InvalidCursorError } from "./errors";

/**
 * Statement cursor encodes the position (postedAt timestamp + journal_line id)
 * needed to resume pagination at the next batch.
 *
 * Encoding: base64url of JSON `{ p: ISO-string, i: line-id-as-string }`.
 *
 * Cursors are stable (don't depend on absolute offset), survive concurrent
 * inserts, and are opaque to the caller — never construct one by hand.
 */
export interface StatementCursorPosition {
  postedAt: Date;
  lineId: bigint;
}

export function encodeStatementCursor(position: StatementCursorPosition): string {
  const payload = {
    p: position.postedAt.toISOString(),
    i: position.lineId.toString(),
  };
  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf-8").toString("base64url");
}

export function decodeStatementCursor(cursor: string): StatementCursorPosition {
  let payload: { p: string; i: string };
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf-8");
    payload = JSON.parse(json);
  } catch {
    throw new InvalidCursorError(cursor);
  }
  if (typeof payload.p !== "string" || typeof payload.i !== "string") {
    throw new InvalidCursorError(cursor);
  }
  const postedAt = new Date(payload.p);
  if (isNaN(postedAt.getTime())) {
    throw new InvalidCursorError(cursor);
  }
  let lineId: bigint;
  try {
    lineId = BigInt(payload.i);
  } catch {
    throw new InvalidCursorError(cursor);
  }
  return { postedAt, lineId };
}

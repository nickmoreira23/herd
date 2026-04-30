import { describe, it, expect } from "vitest";
import { encodeStatementCursor, decodeStatementCursor } from "../statement-cursor";
import { InvalidCursorError } from "../errors";

describe("statement cursor", () => {
  it("round-trips a position", () => {
    const original = {
      postedAt: new Date("2026-01-15T10:00:00.000Z"),
      lineId: 12345n,
    };
    const encoded = encodeStatementCursor(original);
    const decoded = decodeStatementCursor(encoded);
    expect(decoded.postedAt.toISOString()).toBe(original.postedAt.toISOString());
    expect(decoded.lineId).toBe(original.lineId);
  });

  it("encoded cursor is base64url (no '+', '/', '=')", () => {
    const encoded = encodeStatementCursor({
      postedAt: new Date("2026-01-15T10:00:00.000Z"),
      lineId: 12345n,
    });
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("rejects garbage", () => {
    expect(() => decodeStatementCursor("not-a-cursor")).toThrow(InvalidCursorError);
  });

  it("rejects malformed payload", () => {
    const malformed = Buffer.from('{"foo":"bar"}', "utf-8").toString("base64url");
    expect(() => decodeStatementCursor(malformed)).toThrow(InvalidCursorError);
  });

  it("rejects invalid date in payload", () => {
    const bad = Buffer.from('{"p":"not-a-date","i":"1"}', "utf-8").toString("base64url");
    expect(() => decodeStatementCursor(bad)).toThrow(InvalidCursorError);
  });

  it("rejects invalid bigint in payload", () => {
    const bad = Buffer.from('{"p":"2026-01-15T10:00:00.000Z","i":"abc"}', "utf-8").toString("base64url");
    expect(() => decodeStatementCursor(bad)).toThrow(InvalidCursorError);
  });
});

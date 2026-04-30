import { describe, it, expect } from "vitest";
import { computeNextAttempt, MAX_ATTEMPTS } from "../compute-next-attempt";

describe("computeNextAttempt", () => {
  const now = new Date("2024-01-01T00:00:00.000Z");

  it("schedules attempt 1 at +1 minute", () => {
    const next = computeNextAttempt(1, now);
    expect(next).not.toBeNull();
    expect(next!.getTime() - now.getTime()).toBe(60 * 1000);
  });

  it("schedules attempt 2 at +5 minutes", () => {
    const next = computeNextAttempt(2, now);
    expect(next!.getTime() - now.getTime()).toBe(5 * 60 * 1000);
  });

  it("schedules attempt 3 at +30 minutes", () => {
    const next = computeNextAttempt(3, now);
    expect(next!.getTime() - now.getTime()).toBe(30 * 60 * 1000);
  });

  it("schedules attempt 4 at +2 hours", () => {
    const next = computeNextAttempt(4, now);
    expect(next!.getTime() - now.getTime()).toBe(2 * 60 * 60 * 1000);
  });

  it("returns null on exhaustion (attempt 5)", () => {
    expect(computeNextAttempt(5, now)).toBeNull();
  });

  it("returns null beyond exhaustion", () => {
    expect(computeNextAttempt(6, now)).toBeNull();
    expect(computeNextAttempt(100, now)).toBeNull();
  });

  it("throws on attempts < 1", () => {
    expect(() => computeNextAttempt(0, now)).toThrow();
    expect(() => computeNextAttempt(-1, now)).toThrow();
  });

  it("MAX_ATTEMPTS is 5", () => {
    expect(MAX_ATTEMPTS).toBe(5);
  });
});

import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "../format-relative-time";

describe("formatRelativeTime", () => {
  const now = new Date("2024-01-15T12:00:00Z");

  it("formats past time in pt-BR", () => {
    const past = new Date("2024-01-15T10:00:00Z"); // 2 hours ago
    expect(formatRelativeTime(past, "pt-BR", now)).toMatch(/há 2 horas/);
  });

  it("formats past time in en-US", () => {
    const past = new Date("2024-01-15T10:00:00Z");
    expect(formatRelativeTime(past, "en-US", now)).toMatch(/2 hours ago/);
  });

  it("formats future time", () => {
    const future = new Date("2024-01-18T12:00:00Z"); // 3 days from now
    expect(formatRelativeTime(future, "en-US", now)).toMatch(/in 3 days/);
  });

  it("uses 'days' for multi-day differences", () => {
    const oldDate = new Date("2024-01-10T12:00:00Z"); // 5 days ago
    expect(formatRelativeTime(oldDate, "en-US", now)).toMatch(/5 days ago/);
  });

  it("uses 'years' for very old dates", () => {
    const longAgo = new Date("2022-01-15T12:00:00Z"); // 2 years ago
    expect(formatRelativeTime(longAgo, "en-US", now)).toMatch(/2 years ago/);
  });

  it("handles same instant gracefully", () => {
    expect(formatRelativeTime(now, "en-US", now)).toMatch(/now|0 seconds/i);
  });
});

import { describe, it, expect } from "vitest";
import { formatDate } from "../format-date";

describe("formatDate", () => {
  const date = new Date("2024-01-15T10:30:00Z");

  it("formats short in pt-BR", () => {
    const result = formatDate(date, "pt-BR", "short");
    expect(result).toMatch(/15\/01\/2024/);
  });

  it("formats short in en-US", () => {
    const result = formatDate(date, "en-US", "short");
    expect(result).toMatch(/01\/15\/2024/);
  });

  it("formats long in pt-BR", () => {
    const result = formatDate(date, "pt-BR", "long");
    expect(result).toMatch(/15 de janeiro de 2024/);
  });

  it("formats long in en-US", () => {
    const result = formatDate(date, "en-US", "long");
    expect(result).toMatch(/January 15, 2024/);
  });

  it("formats dateTime in pt-BR (24h)", () => {
    const result = formatDate(date, "pt-BR", "dateTime");
    expect(result).toMatch(/15\/01\/2024/);
    // 24h format — no AM/PM
    expect(result).not.toMatch(/[AP]M/);
  });

  it("formats time-only in en-US (12h)", () => {
    const result = formatDate(date, "en-US", "time");
    // 12h format with AM/PM
    expect(result).toMatch(/[AP]M/i);
  });

  it("uses short as default preset", () => {
    expect(formatDate(date, "pt-BR")).toBe(formatDate(date, "pt-BR", "short"));
  });
});

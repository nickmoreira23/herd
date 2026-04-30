import { describe, it, expect } from "vitest";
import { formatNumber } from "../format-number";

describe("formatNumber", () => {
  it("integer pt-BR uses '.' as thousands separator", () => {
    expect(formatNumber(1234567, "pt-BR", "integer")).toBe("1.234.567");
  });

  it("integer en-US uses ',' as thousands separator", () => {
    expect(formatNumber(1234567, "en-US", "integer")).toBe("1,234,567");
  });

  it("decimal pt-BR uses ',' as decimal separator", () => {
    expect(formatNumber(1234.56, "pt-BR", "decimal")).toBe("1.234,56");
  });

  it("decimal en-US uses '.' as decimal separator", () => {
    expect(formatNumber(1234.56, "en-US", "decimal")).toBe("1,234.56");
  });

  it("percent treats input as fraction", () => {
    expect(formatNumber(0.85, "pt-BR", "percent")).toMatch(/85.*%/);
  });

  it("compact for thousands", () => {
    const result = formatNumber(1200, "en-US", "compact");
    expect(result).toMatch(/1\.2K/);
  });

  it("accepts bigint", () => {
    expect(formatNumber(1000000n, "en-US", "integer")).toBe("1,000,000");
  });
});

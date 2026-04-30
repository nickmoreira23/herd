import { describe, it, expect, vi } from "vitest";
import { translateError, translateErrorWithT } from "../translate-error";

// Mock t to return predictable output
vi.mock("../t", () => ({
  t: (key: string, locale: string, params?: Record<string, unknown>) => {
    return `[${locale}] ${key}` + (params ? ` ${JSON.stringify(params)}` : "");
  },
}));

describe("translateError", () => {
  it("uses error.code as dictionary lookup", () => {
    const err = {
      code: "ledger.account_not_found",
      message: "Account not found",
      accountCode: "platform:revenue:brl",
    };
    const result = translateError(err, "pt-BR");
    expect(result).toContain("error.ledger.account_not_found");
    expect(result).toContain("platform:revenue:brl");
  });

  it("extracts string params from error fields", () => {
    const err = {
      code: "ledger.currency_mismatch",
      message: "...",
      expectedCurrency: "BRL",
      actualCurrency: "USD",
    };
    const result = translateError(err, "en-US");
    expect(result).toContain("BRL");
    expect(result).toContain("USD");
  });

  it("converts bigint to string in params", () => {
    const err = {
      code: "ledger.unbalanced_entry",
      message: "...",
      netCents: 100n,
    };
    const result = translateError(err, "pt-BR");
    expect(result).toContain("100");
  });

  it("falls back to error.common.unknown for unstructured errors", () => {
    const result = translateError(new Error("oops"), "pt-BR");
    expect(result).toContain("error.common.unknown");
  });

  it("falls back for null/undefined", () => {
    expect(translateError(null, "pt-BR")).toContain("error.common.unknown");
    expect(translateError(undefined, "pt-BR")).toContain("error.common.unknown");
  });
});

describe("translateErrorWithT", () => {
  it("uses provided translator function", () => {
    const t = vi.fn().mockReturnValue("translated");
    const err = { code: "ledger.account_not_found", message: "..." };
    expect(translateErrorWithT(err, t)).toBe("translated");
    expect(t).toHaveBeenCalledWith(
      "error.ledger.account_not_found",
      expect.any(Object),
    );
  });

  it("falls back to error.common.unknown for raw errors", () => {
    const t = vi.fn().mockReturnValue("unknown");
    expect(translateErrorWithT(new Error("oops"), t)).toBe("unknown");
    expect(t).toHaveBeenCalledWith("error.common.unknown");
  });
});

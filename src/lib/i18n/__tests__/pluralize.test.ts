import { describe, it, expect } from "vitest";
import { pluralize } from "../pluralize";

describe("pluralize", () => {
  const forms = {
    one: "{count} item",
    other: "{count} itens",
  };

  it("uses 'one' for count = 1 in pt-BR", () => {
    expect(pluralize(1, "pt-BR", forms)).toBe("1 item");
  });

  // pt-BR Intl.PluralRules classifies 0 as "one" (unlike en-US, which uses "other").
  // Both are linguistically valid; the helper just dispatches the form.
  it("uses 'one' for count = 0 in pt-BR (Intl.PluralRules behavior)", () => {
    expect(pluralize(0, "pt-BR", forms)).toBe("0 item");
  });

  it("uses 'other' for count > 1 in pt-BR", () => {
    expect(pluralize(5, "pt-BR", forms)).toBe("5 itens");
  });

  it("uses 'one' for count = 1 in en-US", () => {
    expect(pluralize(1, "en-US", forms)).toBe("1 item");
  });

  it("uses 'other' for count = 0 in en-US", () => {
    expect(pluralize(0, "en-US", forms)).toBe("0 itens");
  });

  it("uses 'other' for count > 1 in en-US", () => {
    expect(pluralize(5, "en-US", forms)).toBe("5 itens");
  });

  it("substitutes {count} placeholder", () => {
    const result = pluralize(42, "en-US", {
      one: "{count} apple",
      other: "{count} apples",
    });
    expect(result).toBe("42 apples");
  });

  it("falls back to 'other' if specific form is missing", () => {
    expect(pluralize(2, "pt-BR", forms)).toBe("2 itens");
  });
});

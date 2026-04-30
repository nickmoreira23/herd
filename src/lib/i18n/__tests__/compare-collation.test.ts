import { describe, it, expect } from "vitest";
import { compareCollation } from "../compare-collation";

describe("compareCollation", () => {
  it("sorts pt-BR strings respecting Portuguese collation", () => {
    const arr = ["açai", "abacaxi", "amora"];
    arr.sort(compareCollation("pt-BR"));
    expect(arr).toEqual(["abacaxi", "açai", "amora"]);
  });

  it("sorts en-US strings alphabetically", () => {
    const arr = ["banana", "apple", "cherry"];
    arr.sort(compareCollation("en-US"));
    expect(arr).toEqual(["apple", "banana", "cherry"]);
  });

  it("treats accented characters as equal at base sensitivity", () => {
    const compare = compareCollation("pt-BR");
    expect(compare("acai", "açai")).toBe(0);
  });

  it("respects numeric: true for natural number sort", () => {
    const arr = ["item 10", "item 2", "item 1"];
    arr.sort(compareCollation("en-US"));
    expect(arr).toEqual(["item 1", "item 2", "item 10"]);
  });

  it("can override sensitivity via options", () => {
    const compare = compareCollation("pt-BR", { sensitivity: "case" });
    expect(compare("a", "A")).not.toBe(0);
  });
});

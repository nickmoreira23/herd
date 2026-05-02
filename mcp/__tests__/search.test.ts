/**
 * Tests for the shared search logic. Integration-style: hits the real
 * search-index.json so what we test matches what ships. Drift between
 * fixtures and prod cannot happen.
 *
 * Coverage: empty queries, exact match, ordering by field weight, limit,
 * snippet highlight, hierarchical URL, locale switching.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { searchEntries } from "../../src/lib/handbook/search";
import type { IndexEntry } from "../../src/lib/handbook/search-index";

const indexPath = join(process.cwd(), "mcp/generated/search-index.json");
const index = (
  JSON.parse(readFileSync(indexPath, "utf-8")) as { entries: IndexEntry[] }
).entries;

describe("searchEntries", () => {
  it("returns empty for empty query", () => {
    const results = searchEntries(index, "", { locale: "en-US" });
    expect(results).toEqual([]);
  });

  it("returns empty for whitespace-only query", () => {
    const results = searchEntries(index, "   ", { locale: "en-US" });
    expect(results).toEqual([]);
  });

  it("finds layer by id substring", () => {
    const results = searchEntries(index, "blocks", { locale: "en-US" });
    expect(results.length).toBeGreaterThan(0);
    // The Blocks layer should be the top result (uid + id + title all match).
    expect(results[0].uid).toBe("herd.layer.blocks");
  });

  it("ordering: uid match outranks body-only match", () => {
    const results = searchEntries(index, "ledger", { locale: "en-US" });
    expect(results.length).toBeGreaterThan(0);
    // herd.tool.financial.ledger has uid match → should be first.
    expect(results[0].uid).toBe("herd.tool.financial.ledger");
  });

  it("respects limit option", () => {
    const results = searchEntries(index, "the", {
      locale: "en-US",
      limit: 3,
    });
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("snippet wraps the matched term in <mark>", () => {
    const results = searchEntries(index, "ledger", { locale: "en-US" });
    const ledger = results.find((r) => r.uid === "herd.tool.financial.ledger");
    expect(ledger).toBeDefined();
    expect(ledger!.snippet).toMatch(/<mark>/i);
  });

  it("URL is hierarchical (layer/category/feature)", () => {
    const results = searchEntries(index, "ledger", { locale: "en-US" });
    const ledger = results.find((r) => r.uid === "herd.tool.financial.ledger");
    expect(ledger).toBeDefined();
    expect(ledger!.url).toBe("/admin/handbook/tools/financial/ledger");
  });

  it("URL for layer omits category and feature", () => {
    const results = searchEntries(index, "blocks", { locale: "en-US" });
    const layer = results.find((r) => r.uid === "herd.layer.blocks");
    expect(layer).toBeDefined();
    expect(layer!.url).toBe("/admin/handbook/blocks");
  });

  it("URL for meta entries uses /meta/ prefix", () => {
    const results = searchEntries(index, "handbook", { locale: "en-US" });
    const meta = results.find((r) => r.uid === "herd.meta.handbook");
    expect(meta).toBeDefined();
    expect(meta!.url).toBe("/admin/handbook/meta/handbook");
  });

  it("locale pt-BR returns pt-BR titles", () => {
    const results = searchEntries(index, "blocos", { locale: "pt-BR" });
    expect(results.length).toBeGreaterThan(0);
    const layer = results.find((r) => r.uid === "herd.layer.blocks");
    expect(layer).toBeDefined();
    expect(layer!.title).toBe("Blocos");
  });

  it("locale en-US returns en-US titles", () => {
    const results = searchEntries(index, "blocks", { locale: "en-US" });
    const layer = results.find((r) => r.uid === "herd.layer.blocks");
    expect(layer).toBeDefined();
    expect(layer!.title).toBe("Blocks");
  });
});

/**
 * Tests for the MCP fetch tool. Integration-style: hits the real
 * search-index.json.
 */
import { describe, it, expect } from "vitest";
import { executeFetch } from "../tools/fetch";

describe("executeFetch", () => {
  it("returns content for a valid UID", () => {
    const result = executeFetch("herd.tool.financial.ledger");
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.id).toBe("herd.tool.financial.ledger");
    expect(result.title).toBe("Ledger");
    expect(result.text).toMatch(/Ledger/i);
  });

  it("returns error for unknown UID", () => {
    const result = executeFetch("herd.tool.nonexistent.xyz");
    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toMatch(/no entry/i);
  });

  it("URL is hierarchical (layer/category/feature)", () => {
    const result = executeFetch("herd.tool.financial.ledger");
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    // Bug fixed in MCP tests sub-etapa: was using flat `${level}/${id}`
    // which produced /admin/handbook/tool/ledger (broken). Now uses
    // hrefForEntry → hierarchical /admin/handbook/tools/financial/ledger.
    expect(result.url).toBe(
      "https://herd.com/admin/handbook/tools/financial/ledger",
    );
  });

  it("URL for meta entry uses /meta/ prefix", () => {
    const result = executeFetch("herd.meta.handbook");
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.url).toBe("https://herd.com/admin/handbook/meta/handbook");
  });

  it("URL for layer omits category and feature", () => {
    const result = executeFetch("herd.layer.blocks");
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.url).toBe("https://herd.com/admin/handbook/blocks");
  });

  it("returns metadata with both locale titles", () => {
    const result = executeFetch("herd.layer.blocks");
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.metadata.title_pt_BR).toBe("Blocos");
    expect(result.title).toBe("Blocks");
  });
});

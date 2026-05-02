/**
 * Smoke test for createServer(). The McpServer SDK doesn't expose tool
 * introspection cleanly (registerTool returns void), so the test is
 * intentionally minimal: confirm construction succeeds and the returned
 * object has the SDK-expected shape.
 *
 * Tool behavior is covered by search.test.ts and fetch.test.ts.
 */
import { describe, it, expect } from "vitest";
import { createServer } from "../server";

describe("MCP server", () => {
  it("creates server without throwing", () => {
    const server = createServer();
    expect(server).toBeDefined();
  });

  it("returned server exposes connect() (Transport contract)", () => {
    const server = createServer();
    // McpServer wraps a low-level Server; both expose `connect`.
    expect(typeof server.connect).toBe("function");
  });
});

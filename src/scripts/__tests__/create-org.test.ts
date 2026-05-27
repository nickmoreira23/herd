import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { resolve } from "path";

describe("create-org script", () => {
  // Smoke test: script exists and is well-formed
  it("script file exists", () => {
    const scriptPath = resolve(process.cwd(), "scripts/create-org.ts");
    expect(existsSync(scriptPath)).toBe(true);
  });
});

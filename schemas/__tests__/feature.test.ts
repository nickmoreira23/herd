import { describe, it, expect } from "vitest";
import { FeatureYmlSchema } from "../feature.zod";

describe("FeatureYmlSchema", () => {
  const validBase = {
    id: "contacts",
    uid: "herd.block.contacts",
    level: "block" as const,
    title: { "pt-BR": "Contatos", "en-US": "Contacts" },
    description: { "pt-BR": "Fonte única.", "en-US": "Single source." },
    owners: ["@nick"],
    since: "2026-05-01",
    updated: "2026-05-01",
  };

  it("accepts a minimal valid block", () => {
    expect(FeatureYmlSchema.safeParse(validBase).success).toBe(true);
  });

  it("rejects invalid level", () => {
    expect(FeatureYmlSchema.safeParse({ ...validBase, level: "category" }).success).toBe(false);
  });

  it("rejects invalid uid format", () => {
    expect(FeatureYmlSchema.safeParse({ ...validBase, uid: "wrong.format" }).success).toBe(false);
  });

  it("rejects description over 280 chars", () => {
    expect(
      FeatureYmlSchema.safeParse({
        ...validBase,
        description: { "pt-BR": "x".repeat(281), "en-US": "ok" },
      }).success,
    ).toBe(false);
  });

  it("rejects bad date format", () => {
    expect(FeatureYmlSchema.safeParse({ ...validBase, since: "May 1, 2026" }).success).toBe(false);
  });
});

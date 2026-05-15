import { describe, it, expect } from "vitest";
import { normalizeSlug, organizationSlugSchema } from "../organization-slug";

describe("organizationSlugSchema", () => {
  it("accepts simple lowercase slug", () => {
    expect(organizationSlugSchema.parse("acme")).toBe("acme");
    expect(organizationSlugSchema.parse("acme-corp")).toBe("acme-corp");
    expect(organizationSlugSchema.parse("a1b2c3")).toBe("a1b2c3");
  });

  it("rejects empty string", () => {
    expect(() => organizationSlugSchema.parse("")).toThrow();
  });

  it("rejects leading hyphen", () => {
    expect(() => organizationSlugSchema.parse("-acme")).toThrow();
  });

  it("rejects trailing hyphen", () => {
    expect(() => organizationSlugSchema.parse("acme-")).toThrow();
  });

  it("rejects consecutive hyphens", () => {
    expect(() => organizationSlugSchema.parse("acme--corp")).toThrow();
  });

  it("rejects uppercase", () => {
    expect(() => organizationSlugSchema.parse("Acme")).toThrow();
  });

  it("rejects special characters", () => {
    expect(() => organizationSlugSchema.parse("acme.corp")).toThrow();
    expect(() => organizationSlugSchema.parse("acme_corp")).toThrow();
    expect(() => organizationSlugSchema.parse("acme+corp")).toThrow();
  });

  it("rejects strings longer than 63 chars", () => {
    expect(() => organizationSlugSchema.parse("a".repeat(64))).toThrow();
  });

  it("accepts strings exactly 63 chars", () => {
    expect(organizationSlugSchema.parse("a".repeat(63))).toBe("a".repeat(63));
  });
});

describe("normalizeSlug", () => {
  it("lowercases and keeps alphanumerics", () => {
    expect(normalizeSlug("Acme")).toBe("acme");
    expect(normalizeSlug("Alice123")).toBe("alice123");
  });

  it("replaces dots and pluses with hyphen", () => {
    expect(normalizeSlug("alice.smith")).toBe("alice-smith");
    expect(normalizeSlug("alice+test")).toBe("alice-test");
    expect(normalizeSlug("alice.smith+test")).toBe("alice-smith-test");
  });

  it("collapses consecutive hyphens", () => {
    expect(normalizeSlug("alice..smith")).toBe("alice-smith");
    expect(normalizeSlug("alice---smith")).toBe("alice-smith");
  });

  it("strips leading/trailing hyphens", () => {
    expect(normalizeSlug(".alice.")).toBe("alice");
    expect(normalizeSlug("-alice-")).toBe("alice");
  });

  it("replaces unicode non-ascii with hyphen and collapses", () => {
    expect(normalizeSlug("aliceção")).toBe("alice-o");
  });

  it("truncates to 63 chars", () => {
    expect(normalizeSlug("a".repeat(100))).toHaveLength(63);
  });

  it("normalized output passes schema validation when non-empty", () => {
    const slug = normalizeSlug("Alice.Smith+Test@example.com");
    expect(slug).toBe("alice-smith-test-example-com");
    expect(() => organizationSlugSchema.parse(slug)).not.toThrow();
  });
});

import { describe, it, expect } from "vitest";
import { toKebab, roleErrorKey, canMutateRoles } from "../roles-manager.helpers";

describe("toKebab", () => {
  it("lowercases and hyphenates", () => {
    expect(toKebab("Regional Manager")).toBe("regional-manager");
  });
  it("strips punctuation and collapses separators", () => {
    expect(toKebab("  Sales / Ops!! ")).toBe("sales-ops");
  });
  it("trims leading/trailing hyphens", () => {
    expect(toKebab("--Lead--")).toBe("lead");
  });
  it("empty / symbols-only → empty", () => {
    expect(toKebab("")).toBe("");
    expect(toKebab("@#$")).toBe("");
  });
});

describe("roleErrorKey — 422 prose → i18n key", () => {
  it("duplicate key", () => {
    expect(roleErrorKey("A role with this key already exists")).toBe(
      "organization.roles.error.duplicate",
    );
  });
  it("reserved collision", () => {
    expect(roleErrorKey("Name/key collides with a system role")).toBe(
      "organization.roles.error.reserved",
    );
  });
  it("unknown → generic invalid", () => {
    expect(roleErrorKey("")).toBe("organization.roles.error.invalid");
    expect(roleErrorKey("something else")).toBe("organization.roles.error.invalid");
  });
});

describe("canMutateRoles — OWNER-only mutation gate (super bypass)", () => {
  it("OWNER → true", () => {
    expect(canMutateRoles({ orgRole: "OWNER", isSuperAdmin: false })).toBe(true);
  });
  it("super_admin → true (bypass, even with null orgRole)", () => {
    expect(canMutateRoles({ orgRole: null, isSuperAdmin: true })).toBe(true);
  });
  it("ADMIN → false (sees list read-only)", () => {
    expect(canMutateRoles({ orgRole: "ADMIN", isSuperAdmin: false })).toBe(false);
  });
  it("MEMBER → false", () => {
    expect(canMutateRoles({ orgRole: "MEMBER", isSuperAdmin: false })).toBe(false);
  });
  it("unresolved viewer (null) → false (fail-closed)", () => {
    expect(canMutateRoles(null)).toBe(false);
  });
  it("loading orgRole (undefined), not super → false", () => {
    expect(canMutateRoles({ orgRole: undefined, isSuperAdmin: false })).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { toKebab, roleErrorKey, grantErrorKey, canMutateRoles, formatFieldErrors } from "../roles-manager.helpers";

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

describe("roleErrorKey — 422 CODE → i18n key", () => {
  it("key_duplicate", () => {
    expect(roleErrorKey("key_duplicate")).toBe("organization.roles.error.duplicate");
  });
  it("name_reserved", () => {
    expect(roleErrorKey("name_reserved")).toBe("organization.roles.error.reserved");
  });
  it("unknown/empty → generic invalid", () => {
    expect(roleErrorKey("")).toBe("organization.roles.error.invalid");
    expect(roleErrorKey("whatever")).toBe("organization.roles.error.invalid");
  });
});

describe("grantErrorKey — grant-editor CODE → i18n key", () => {
  it("role_not_found", () => {
    expect(grantErrorKey("role_not_found")).toBe("organization.roles.grants.role_not_found");
  });
  it("invalid_grant", () => {
    expect(grantErrorKey("invalid_grant")).toBe("organization.roles.grants.invalid_grant");
  });
  it("unknown → generic save_error", () => {
    expect(grantErrorKey("")).toBe("organization.roles.grants.save_error");
  });
});

describe("formatFieldErrors — 400 details → inline diagnostic line", () => {
  it("renders the description-null contract error (the PROD incident shape)", () => {
    expect(
      formatFieldErrors({
        formErrors: [],
        fieldErrors: { description: ["Expected string, received null"] },
      }),
    ).toBe("description: Expected string, received null");
  });
  it("joins multiple fields and messages", () => {
    expect(
      formatFieldErrors({
        fieldErrors: { key: ["key must be kebab-case"], name: ["too big", "bad"] },
      }),
    ).toBe("key: key must be kebab-case; name: too big, bad");
  });
  it("null / malformed / empty details → null", () => {
    expect(formatFieldErrors(null)).toBeNull();
    expect(formatFieldErrors(undefined)).toBeNull();
    expect(formatFieldErrors("oops")).toBeNull();
    expect(formatFieldErrors({ fieldErrors: {} })).toBeNull();
    expect(formatFieldErrors({ fieldErrors: { a: [] } })).toBeNull();
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

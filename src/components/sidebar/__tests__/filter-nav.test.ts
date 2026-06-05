import { describe, it, expect } from "vitest";
import { isNavItemVisible, filterNavByAccess, type NavViewer, type CanFn } from "../filter-nav";
import type { ProfileNav } from "../nav-config";
import { Home } from "lucide-react";

const SUPER: NavViewer = { orgRole: null, isSuperAdmin: true };
const MEMBER: NavViewer = { orgRole: "MEMBER", isSuperAdmin: false };
const OWNER: NavViewer = { orgRole: "OWNER", isSuperAdmin: false };
const NON_MEMBER: NavViewer = { orgRole: null, isSuperAdmin: false };
const LOADING: NavViewer = { orgRole: undefined, isSuperAdmin: false };

const ALLOW_NONE: CanFn = () => false; // fail-closed stub
const ALLOW_ALL: CanFn = () => true; // mirrors useCan for super_admin / full grant

describe("isNavItemVisible — Fase 7b (gate + perm + can)", () => {
  it("ungated → visible to everyone", () => {
    for (const v of [SUPER, MEMBER, OWNER, NON_MEMBER, LOADING]) {
      expect(isNavItemVisible({}, v, ALLOW_NONE)).toBe(true);
    }
  });

  describe("perm (DOMAIN) — derives from can(), fail-closed", () => {
    const item = { perm: { resource: "members" as const, action: "read" as const } };
    it("can() true → visible", () => {
      expect(isNavItemVisible(item, MEMBER, ALLOW_ALL)).toBe(true);
    });
    it("can() false → HIDDEN (fail-closed), regardless of role", () => {
      expect(isNavItemVisible(item, OWNER, ALLOW_NONE)).toBe(false);
      expect(isNavItemVisible(item, MEMBER, ALLOW_NONE)).toBe(false);
    });
    it("super_admin: useCan bypasses → modeled by ALLOW_ALL → visible", () => {
      expect(isNavItemVisible(item, SUPER, ALLOW_ALL)).toBe(true);
    });
  });

  describe('gate "ownerOnly" (GOVERNANCE — enum, outside can())', () => {
    const item = { gate: "ownerOnly" as const };
    it("OWNER → visible", () => expect(isNavItemVisible(item, OWNER, ALLOW_NONE)).toBe(true));
    it("ADMIN/MEMBER → hidden", () => {
      expect(isNavItemVisible(item, { orgRole: "ADMIN", isSuperAdmin: false }, ALLOW_NONE)).toBe(false);
      expect(isNavItemVisible(item, MEMBER, ALLOW_NONE)).toBe(false);
    });
    it("super_admin → visible (bypass)", () => expect(isNavItemVisible(item, SUPER, ALLOW_NONE)).toBe(true));
  });

  describe('gate "superAdmin"', () => {
    const item = { gate: "superAdmin" as const };
    it("only super_admin", () => {
      expect(isNavItemVisible(item, SUPER, ALLOW_NONE)).toBe(true);
      expect(isNavItemVisible(item, OWNER, ALLOW_NONE)).toBe(false);
    });
  });

  describe('gate "member"', () => {
    const item = { gate: "member" as const };
    it("any role → visible; non-member → hidden; loading → fail-open; super → visible", () => {
      expect(isNavItemVisible(item, MEMBER, ALLOW_NONE)).toBe(true);
      expect(isNavItemVisible(item, NON_MEMBER, ALLOW_NONE)).toBe(false);
      expect(isNavItemVisible(item, LOADING, ALLOW_NONE)).toBe(true);
      expect(isNavItemVisible(item, SUPER, ALLOW_NONE)).toBe(true);
    });
  });
});

describe("filterNavByAccess — per-role reflex (perm derives from the matrix)", () => {
  const nav: ProfileNav = {
    top: [
      { type: "link", href: "/members", label: "Members", icon: Home, perm: { resource: "members", action: "read" } },
      { type: "link", href: "/overrides", label: "Permissions", icon: Home, gate: "ownerOnly" },
      { type: "link", href: "/home", label: "Home", icon: Home },
    ],
    middle: null,
    bottom: [],
  };

  it("MEMBER with members:read granted → sees Members + Home, NOT the OWNER governance item", () => {
    const can: CanFn = (r, a) => r === "members" && a === "read";
    const out = filterNavByAccess(nav, MEMBER, can);
    const hrefs = out.top.map((i) => (i.type === "link" ? i.href : ""));
    expect(hrefs).toEqual(["/members", "/home"]);
  });

  it("MEMBER WITHOUT the grant (synthetic deny) → Members hidden (fail-closed)", () => {
    const out = filterNavByAccess(nav, MEMBER, ALLOW_NONE);
    const hrefs = out.top.map((i) => (i.type === "link" ? i.href : ""));
    expect(hrefs).toEqual(["/home"]); // only the ungated item
  });

  it("OWNER → sees the governance item; super_admin → sees everything", () => {
    const ownerCan: CanFn = (r, a) => r === "members" && a === "read";
    const owner = filterNavByAccess(nav, OWNER, ownerCan).top.map((i) => (i.type === "link" ? i.href : ""));
    expect(owner).toContain("/overrides");
    const sup = filterNavByAccess(nav, SUPER, ALLOW_ALL).top.map((i) => (i.type === "link" ? i.href : ""));
    expect(sup).toEqual(["/members", "/overrides", "/home"]);
  });
});

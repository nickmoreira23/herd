import { describe, it, expect } from "vitest";
import { isNavItemVisible, filterNavByAccess, type NavViewer } from "../filter-nav";
import type { ProfileNav } from "../nav-config";
import { Home } from "lucide-react";

const SUPER: NavViewer = { orgRole: null, isSuperAdmin: true };
const MEMBER: NavViewer = { orgRole: "MEMBER", isSuperAdmin: false };
const OWNER: NavViewer = { orgRole: "OWNER", isSuperAdmin: false };
const NON_MEMBER: NavViewer = { orgRole: null, isSuperAdmin: false }; // loaded, not a member
const LOADING: NavViewer = { orgRole: undefined, isSuperAdmin: false }; // /api/org/current in flight

describe("isNavItemVisible — gate × viewer matrix", () => {
  it("ungated → visible to everyone", () => {
    for (const v of [SUPER, MEMBER, OWNER, NON_MEMBER, LOADING]) {
      expect(isNavItemVisible(undefined, v)).toBe(true);
    }
  });

  describe('gate "member"', () => {
    it("member (any role) → visible", () => {
      expect(isNavItemVisible("member", MEMBER)).toBe(true);
      expect(isNavItemVisible("member", OWNER)).toBe(true);
    });
    it("super_admin → visible (bypass)", () => {
      expect(isNavItemVisible("member", SUPER)).toBe(true);
    });
    it("non-member (loaded null, not super) → HIDDEN (definitive negative)", () => {
      expect(isNavItemVisible("member", NON_MEMBER)).toBe(false);
    });
    it("loading (orgRole undefined, not super) → VISIBLE (fail-open)", () => {
      expect(isNavItemVisible("member", LOADING)).toBe(true);
    });
  });

  describe('gate "superAdmin"', () => {
    it("super_admin → visible", () => {
      expect(isNavItemVisible("superAdmin", SUPER)).toBe(true);
    });
    it("member / owner / non-member / loading (not super) → hidden", () => {
      for (const v of [MEMBER, OWNER, NON_MEMBER, LOADING]) {
        expect(isNavItemVisible("superAdmin", v)).toBe(false);
      }
    });
  });
});

describe("filterNavByAccess", () => {
  const nav: ProfileNav = {
    top: [
      { type: "link", href: "/admin", label: "Dashboard", icon: Home }, // ungated
      { type: "link", href: "/admin/organization/profile", label: "Organization", icon: Home, gate: "member" },
      { type: "link", href: "/admin/organization/members", label: "Members", icon: Home, gate: "member" },
    ],
    middle: {
      label: "Work",
      icon: Home,
      items: [
        { type: "link", href: "/admin/x", label: "X", icon: Home }, // ungated
        {
          type: "group",
          label: "G",
          icon: Home,
          children: [{ type: "link", href: "/admin/blocks", label: "Blocks", icon: Home, gate: "member" }],
        },
      ],
    },
    bottom: [{ type: "link", href: "/admin/blocks", label: "Blocks", icon: Home, gate: "member" }],
  };

  it("member sees gated + ungated", () => {
    const r = filterNavByAccess(nav, MEMBER);
    expect(r.top.map((i) => (i.type === "link" ? i.label : i.label))).toEqual(["Dashboard", "Organization", "Members"]);
    expect(r.bottom).toHaveLength(1);
    expect(r.middle?.items).toHaveLength(2); // ungated + group(with visible child)
  });

  it("non-member sees only ungated; gated dropped (+ empty group dropped)", () => {
    const r = filterNavByAccess(nav, NON_MEMBER);
    expect(r.top.map((i) => i.label)).toEqual(["Dashboard"]);
    expect(r.bottom).toHaveLength(0);
    // group's only child was member-gated → child removed → group dropped
    expect(r.middle?.items.map((i) => i.label)).toEqual(["X"]);
  });

  it("super_admin sees everything", () => {
    const r = filterNavByAccess(nav, SUPER);
    expect(r.top).toHaveLength(3);
    expect(r.bottom).toHaveLength(1);
    expect(r.middle?.items).toHaveLength(2);
  });

  it("loading (fail-open) shows everything", () => {
    const r = filterNavByAccess(nav, LOADING);
    expect(r.top).toHaveLength(3);
    expect(r.bottom).toHaveLength(1);
  });

  it("does not mutate the input", () => {
    const before = JSON.parse(JSON.stringify(nav.top.map((i) => i.label)));
    filterNavByAccess(nav, NON_MEMBER);
    expect(nav.top.map((i) => i.label)).toEqual(before);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../tree", () => ({ getDescendants: vi.fn() }));
vi.mock("@/lib/tenancy/context", () => ({
  withTenant: vi.fn((_id: string, fn: () => unknown) => fn()),
}));

import {
  assertCanOperateOnTenant,
  withVerticalTenant,
  OrgVerticalForbiddenError,
} from "../vertical-tenant";
import { getDescendants } from "../tree";
import { withTenant } from "@/lib/tenancy/context";

const mockGetDescendants = vi.mocked(getDescendants);
const mockWithTenant = vi.mocked(withTenant);

// PARENT → [CHILD, GRANDCHILD]; SIBLING/ARBITRARY not in the set.
const PARENT = "org-parent";
const CHILD = "org-child";
function descendantsOfParent() {
  return [
    { id: CHILD, slug: "child", name: "Child", parentOrgId: PARENT, depth: 1 },
    { id: "org-grandchild", slug: "gc", name: "GC", parentOrgId: CHILD, depth: 2 },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetDescendants.mockResolvedValue(descendantsOfParent() as never);
});

describe("assertCanOperateOnTenant", () => {
  it("resolves when childId is a strict descendant (authorization passes)", async () => {
    await expect(assertCanOperateOnTenant(PARENT, CHILD)).resolves.toBeUndefined();
  });

  it("throws on self (self is not a vertical target)", async () => {
    await expect(assertCanOperateOnTenant(PARENT, PARENT)).rejects.toBeInstanceOf(
      OrgVerticalForbiddenError
    );
    expect(mockGetDescendants).not.toHaveBeenCalled(); // short-circuits before the tree query
  });

  it("#2 throws for a non-descendant (sibling/arbitrary) → deny", async () => {
    await expect(assertCanOperateOnTenant(PARENT, "org-sibling")).rejects.toBeInstanceOf(
      OrgVerticalForbiddenError
    );
  });

  it("#3 throws when actor is the child targeting the parent (ascendant) → deny", async () => {
    // child's descendants do NOT include the parent
    mockGetDescendants.mockResolvedValueOnce([] as never);
    await expect(assertCanOperateOnTenant(CHILD, PARENT)).rejects.toBeInstanceOf(
      OrgVerticalForbiddenError
    );
  });

  it("computes ancestry FRESH on each call (no cache)", async () => {
    await assertCanOperateOnTenant(PARENT, CHILD);
    await assertCanOperateOnTenant(PARENT, CHILD);
    expect(mockGetDescendants).toHaveBeenCalledTimes(2);
  });
});

describe("withVerticalTenant (single gate)", () => {
  it("authorized: runs fn under withTenant(childId)", async () => {
    const fn = vi.fn().mockResolvedValue("done");
    const out = await withVerticalTenant(PARENT, CHILD, fn);
    expect(out).toBe("done");
    expect(mockWithTenant).toHaveBeenCalledOnce();
    expect(mockWithTenant.mock.calls[0][0]).toBe(CHILD); // re-entered into the child
    expect(fn).toHaveBeenCalledOnce();
  });

  it("#6 unauthorized: throws BEFORE withTenant — nothing runs", async () => {
    const fn = vi.fn();
    await expect(withVerticalTenant(PARENT, "org-arbitrary", fn)).rejects.toBeInstanceOf(
      OrgVerticalForbiddenError
    );
    expect(mockWithTenant).not.toHaveBeenCalled(); // gate blocks before re-entry
    expect(fn).not.toHaveBeenCalled(); // nothing written
  });
});

import { describe, it, expect } from "vitest";
import { OWNER_FLOOR, isOwnerFloor } from "../admin-floor";
import { ROLE_PERMISSIONS } from "../role-permissions";

// R&P Fase 6a — the floor is DECLARED but not wired. Prove its tuples are real
// (every floor entry is an actual OWNER grant in the canonical matrix) so Fase 6b
// can rely on them, and the membership helper works.
describe("OWNER_FLOOR (declared, not wired)", () => {
  it("every floor entry is a real OWNER grant in ROLE_PERMISSIONS", () => {
    for (const f of OWNER_FLOOR) {
      const present = ROLE_PERMISSIONS.OWNER.some(
        (g) => g.resource === f.resource && g.action === f.action
      );
      expect(present, `OWNER must grant ${f.resource}.${f.action}`).toBe(true);
    }
  });

  it("isOwnerFloor matches exactly the declared set", () => {
    expect(isOwnerFloor("roles", "delete")).toBe(true);
    expect(isOwnerFloor("members", "update")).toBe(true);
    expect(isOwnerFloor("locations", "read")).toBe(false);
    expect(isOwnerFloor("roles", "invite")).toBe(false);
  });

  it("covers the 5 expected tuples", () => {
    expect(OWNER_FLOOR.length).toBe(5);
  });
});

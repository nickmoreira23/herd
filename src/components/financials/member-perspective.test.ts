import { describe, it, expect } from "vitest";
import {
  MEMBER_PREFIX,
  REPS_ROLE_KEY,
  memberRoleKeys,
  memberDownlineKeys,
  cascadePerspective,
} from "./spreadsheet-shared";

// Minimal salesTeam shape (levels TOP → BASE) — only `id` matters here.
const salesTeam = {
  levels: [
    { id: "vp", name: "VP", threshold: 300, headcountByMonth: [] },
    { id: "regional", name: "Regional", threshold: 100, headcountByMonth: [] },
    { id: "local", name: "Local", threshold: 20, headcountByMonth: [] },
  ],
  repsByMonth: [],
} as unknown as Parameters<typeof memberRoleKeys>[0];

describe("[member-perspective] role keys + downline filter + cascade normalize", () => {
  it("memberRoleKeys is TOP → BASE then reps", () => {
    expect(memberRoleKeys(salesTeam)).toEqual(["vp", "regional", "local", REPS_ROLE_KEY]);
  });

  it("memberDownlineKeys is null for non-member perspectives", () => {
    const keys = memberRoleKeys(salesTeam);
    expect(memberDownlineKeys("general", keys)).toBeNull();
    expect(memberDownlineKeys("some-party-id", keys)).toBeNull();
    expect(memberDownlineKeys(undefined, keys)).toBeNull();
  });

  it("a member perspective keeps the selected role + everyone beneath", () => {
    const keys = memberRoleKeys(salesTeam);
    expect([...(memberDownlineKeys(`${MEMBER_PREFIX}vp`, keys) ?? [])]).toEqual([
      "vp",
      "regional",
      "local",
      REPS_ROLE_KEY,
    ]);
    expect([...(memberDownlineKeys(`${MEMBER_PREFIX}regional`, keys) ?? [])]).toEqual([
      "regional",
      "local",
      REPS_ROLE_KEY,
    ]);
    expect([...(memberDownlineKeys(`${MEMBER_PREFIX}local`, keys) ?? [])]).toEqual([
      "local",
      REPS_ROLE_KEY,
    ]);
    expect([...(memberDownlineKeys(`${MEMBER_PREFIX}${REPS_ROLE_KEY}`, keys) ?? [])]).toEqual([
      REPS_ROLE_KEY,
    ]);
  });

  it("an unknown member role keeps all (never blanks the section)", () => {
    const keys = memberRoleKeys(salesTeam);
    expect([...(memberDownlineKeys(`${MEMBER_PREFIX}ghost`, keys) ?? [])]).toEqual(keys);
  });

  it("cascadePerspective maps member views to general, passes others through", () => {
    expect(cascadePerspective("general")).toBe("general");
    expect(cascadePerspective("party-123")).toBe("party-123");
    expect(cascadePerspective(`${MEMBER_PREFIX}local`)).toBe("general");
    expect(cascadePerspective(undefined)).toBe("general");
  });
});

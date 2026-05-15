import { describe, it, expect } from "vitest";
import { withTenant, getTenantId, requireTenantId } from "../context";

describe("tenant context", () => {
  it("getTenantId returns null outside withTenant", () => {
    expect(getTenantId()).toBeNull();
  });

  it("requireTenantId throws outside withTenant", () => {
    expect(() => requireTenantId()).toThrow(/outside withTenant/);
  });

  it("withTenant sets context for the duration of the callback", async () => {
    expect(getTenantId()).toBeNull();
    await withTenant("org-1", async () => {
      expect(getTenantId()).toBe("org-1");
      expect(requireTenantId()).toBe("org-1");
    });
    expect(getTenantId()).toBeNull();
  });

  it("nested withTenant: inner overrides outer; outer restores after inner returns", async () => {
    await withTenant("outer", async () => {
      expect(getTenantId()).toBe("outer");
      await withTenant("inner", async () => {
        expect(getTenantId()).toBe("inner");
      });
      expect(getTenantId()).toBe("outer");
    });
    expect(getTenantId()).toBeNull();
  });

  it("propagates context across awaits", async () => {
    await withTenant("org-await", async () => {
      await new Promise((r) => setTimeout(r, 5));
      expect(getTenantId()).toBe("org-await");
      await Promise.resolve();
      expect(getTenantId()).toBe("org-await");
    });
  });

  it("error inside withTenant propagates and context is cleared after", async () => {
    await expect(
      withTenant("org-err", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(getTenantId()).toBeNull();
  });

  it("supports synchronous fn (returns Promise)", async () => {
    // withTenant always returns a Promise — wrapping in async ensures ALS
    // context is preserved across the boundary into Prisma's runtime.
    const result = await withTenant("org-sync", () => getTenantId());
    expect(result).toBe("org-sync");
    expect(getTenantId()).toBeNull();
  });
});

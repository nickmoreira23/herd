import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// Hoist mocks so they are available before imports
const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

import { requireSuperAdmin } from "../require-super-admin";

describe("requireSuperAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when session is absent", async () => {
    authMock.mockResolvedValue(null);

    const result = await requireSuperAdmin();

    expect(result).toBeInstanceOf(NextResponse);
    const json = await (result as NextResponse).json();
    expect(json.error).toBe("Authentication required");
    expect((result as NextResponse).status).toBe(401);
  });

  it("returns 401 when session.user is absent", async () => {
    authMock.mockResolvedValue({ user: null });

    const result = await requireSuperAdmin();

    expect(result).toBeInstanceOf(NextResponse);
    const json = await (result as NextResponse).json();
    expect(json.error).toBe("Authentication required");
    expect((result as NextResponse).status).toBe(401);
  });

  it("returns 403 when user has a different role", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com", role: "user" },
    });

    const result = await requireSuperAdmin();

    expect(result).toBeInstanceOf(NextResponse);
    const json = await (result as NextResponse).json();
    expect(json.error).toBe("Forbidden: super_admin role required");
    expect((result as NextResponse).status).toBe(403);
  });

  it("returns 403 when user has no role set", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });

    const result = await requireSuperAdmin();

    expect(result).toBeInstanceOf(NextResponse);
    const json = await (result as NextResponse).json();
    expect(json.error).toBe("Forbidden: super_admin role required");
    expect((result as NextResponse).status).toBe(403);
  });

  it("returns the session when user has super_admin role", async () => {
    const session = {
      user: { id: "admin-1", email: "admin@example.com", role: "super_admin" },
    };
    authMock.mockResolvedValue(session);

    const result = await requireSuperAdmin();

    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual(session);
  });
});

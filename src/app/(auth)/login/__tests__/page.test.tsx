import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// Mock next/headers before importing page
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/tenant/org-resolver", () => ({
  resolveOrgByHost: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock LoginForm so we can inspect props passed to it
vi.mock("../login-form", () => ({
  LoginForm: (props: { orgName: string; errorParam?: string }) =>
    React.createElement("div", {
      "data-testid": "login-form",
      "data-org-name": props.orgName,
      "data-error-param": props.errorParam,
    }),
}));

import { headers } from "next/headers";
import { resolveOrgByHost } from "@/lib/tenant/org-resolver";
import { prisma } from "@/lib/prisma";
import LoginPage from "../page";

const mockHeaders = vi.mocked(headers);
const mockResolveOrgByHost = vi.mocked(resolveOrgByHost);
const mockFindUnique = vi.mocked(prisma.organization.findUnique);

function makeHeadersList(values: Record<string, string>) {
  return {
    get: (key: string) => values[key] ?? null,
  };
}

describe("LoginPage RSC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders ComeçaAI as orgName when on apex (no org resolved)", async () => {
    mockHeaders.mockResolvedValue(
      makeHeadersList({ "x-host": "lvh.me" }) as never,
    );
    mockResolveOrgByHost.mockResolvedValue(null);

    const element = await LoginPage({
      searchParams: Promise.resolve({}),
    });

    expect(element.props.orgName).toBe("ComeçaAI");
    expect(element.props.errorParam).toBeUndefined();
  });

  it("renders org name from DB when on a subdomain with an active org", async () => {
    mockHeaders.mockResolvedValue(
      makeHeadersList({ "x-host": "buckedup.lvh.me" }) as never,
    );
    mockResolveOrgByHost.mockResolvedValue("org-buckedup");
    mockFindUnique.mockResolvedValue({ name: "Bucked Up" } as never);

    const element = await LoginPage({
      searchParams: Promise.resolve({}),
    });

    expect(element.props.orgName).toBe("Bucked Up");
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "org-buckedup" },
      select: { name: true },
    });
  });

  it("falls back to ComeçaAI when org resolves but DB returns null", async () => {
    mockHeaders.mockResolvedValue(
      makeHeadersList({ "x-host": "unknown.lvh.me" }) as never,
    );
    mockResolveOrgByHost.mockResolvedValue("org-unknown");
    mockFindUnique.mockResolvedValue(null);

    const element = await LoginPage({
      searchParams: Promise.resolve({}),
    });

    expect(element.props.orgName).toBe("ComeçaAI");
  });

  it("passes errorParam=org_not_found when searchParams contains the error", async () => {
    mockHeaders.mockResolvedValue(
      makeHeadersList({ "x-host": "lvh.me" }) as never,
    );
    mockResolveOrgByHost.mockResolvedValue(null);

    const element = await LoginPage({
      searchParams: Promise.resolve({ error: "org_not_found" }),
    });

    expect(element.props.errorParam).toBe("org_not_found");
  });

  it("uses host header fallback when x-host is absent", async () => {
    mockHeaders.mockResolvedValue(
      makeHeadersList({ host: "app.lvh.me:3000" }) as never,
    );
    mockResolveOrgByHost.mockResolvedValue("org-app");
    mockFindUnique.mockResolvedValue({ name: "ComeçaAI Plataforma" } as never);

    const element = await LoginPage({
      searchParams: Promise.resolve({}),
    });

    // host header strips the port: "app.lvh.me:3000" → "app.lvh.me"
    expect(mockResolveOrgByHost).toHaveBeenCalledWith("app.lvh.me");
    expect(element.props.orgName).toBe("ComeçaAI Plataforma");
  });
});

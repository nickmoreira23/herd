import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Controllable host for the local-only gate.
let host = "localhost:3001";
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: (k: string) => (k === "host" ? host : null) })),
}));
vi.mock("next-auth/jwt", () => ({ encode: vi.fn(async () => "fake.session.jwt") }));
vi.mock("@/lib/auth/resolve-active-org", () => ({
  resolveActiveOrgIdForProfile: vi.fn(async () => "org-1"),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    networkProfile: {
      findUnique: vi.fn(async () => ({
        id: "admin-1",
        email: "admin@dev.local",
        firstName: "Nick",
        lastName: "Moreira",
      })),
    },
  },
}));

const { GET } = await import("./route");

const req = (secret?: string) =>
  new Request(`http://localhost:3001/api/dev/login${secret ? `?secret=${secret}` : ""}`);

beforeEach(() => {
  host = "localhost:3001";
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("DEV_LOGIN_SECRET", "s3cr3t");
  vi.stubEnv("NEXTAUTH_SECRET", "test-secret");
  vi.stubEnv("ADMIN_EMAIL", "admin@dev.local");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("[dev-login] gating — inert unless every gate passes", () => {
  it("404s in production even with a correct secret", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await GET(req("s3cr3t"))).status).toBe(404);
  });

  it("404s when DEV_LOGIN_SECRET is unset", async () => {
    vi.stubEnv("DEV_LOGIN_SECRET", "");
    expect((await GET(req("s3cr3t"))).status).toBe(404);
  });

  it("404s on a wrong / missing query secret", async () => {
    expect((await GET(req("wrong"))).status).toBe(404);
    expect((await GET(req())).status).toBe(404);
  });

  it("404s on a non-local host", async () => {
    host = "app.comecaai.com.br";
    expect((await GET(req("s3cr3t"))).status).toBe(404);
  });

  it("logs in (302/307 redirect to /admin + session cookie) when all gates pass", async () => {
    const res = await GET(req("s3cr3t"));
    expect([302, 307]).toContain(res.status);
    expect(res.headers.get("location")).toContain("/admin");
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("authjs.session-token=");
    expect(setCookie.toLowerCase()).toContain("httponly");
  });
});

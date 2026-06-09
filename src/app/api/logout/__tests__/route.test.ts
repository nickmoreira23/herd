import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST, buildSessionClearCookieHeaders } from "../route";

function parse(cookie: string) {
  const [namePair, ...rest] = cookie.split("; ");
  const [name, value] = namePair.split("=");
  const attrs = new Map<string, string>();
  const flags = new Set<string>();
  for (const part of rest) {
    const [k, v] = part.split("=");
    if (v === undefined) flags.add(k);
    else attrs.set(k, v);
  }
  return { name, value, attrs, flags };
}

describe("buildSessionClearCookieHeaders", () => {
  it("PROD: clears __Secure- cookie in both scopes (host-only + Domain), Secure set", () => {
    const headers = buildSessionClearCookieHeaders({
      isProduction: true,
      cookieDomain: ".comecaai.com.br",
    });
    expect(headers).toHaveLength(2);

    const hostOnly = parse(headers[0]);
    expect(hostOnly.name).toBe("__Secure-authjs.session-token");
    expect(hostOnly.value).toBe("");
    expect(hostOnly.attrs.get("Path")).toBe("/");
    expect(hostOnly.attrs.get("Max-Age")).toBe("0");
    expect(hostOnly.flags.has("HttpOnly")).toBe(true);
    expect(hostOnly.attrs.get("SameSite")).toBe("Lax");
    expect(hostOnly.flags.has("Secure")).toBe(true);
    expect(hostOnly.attrs.has("Domain")).toBe(false);

    const domainScoped = parse(headers[1]);
    expect(domainScoped.name).toBe("__Secure-authjs.session-token");
    expect(domainScoped.attrs.get("Domain")).toBe(".comecaai.com.br");
    expect(domainScoped.flags.has("Secure")).toBe(true);
    expect(domainScoped.attrs.get("Max-Age")).toBe("0");
  });

  it("DEV: clears non-secure cookie name in both scopes, no Secure flag", () => {
    const headers = buildSessionClearCookieHeaders({
      isProduction: false,
      cookieDomain: ".lvh.me",
    });
    expect(headers).toHaveLength(2);
    for (const h of headers) {
      const c = parse(h);
      expect(c.name).toBe("authjs.session-token");
      expect(c.flags.has("Secure")).toBe(false);
      expect(c.attrs.get("Max-Age")).toBe("0");
    }
    expect(parse(headers[0]).attrs.has("Domain")).toBe(false);
    expect(parse(headers[1]).attrs.get("Domain")).toBe(".lvh.me");
  });

  it("no COOKIE_DOMAIN: emits only the host-only clear", () => {
    const headers = buildSessionClearCookieHeaders({ isProduction: false });
    expect(headers).toHaveLength(1);
    expect(parse(headers[0]).attrs.has("Domain")).toBe(false);
  });
});

describe("POST /api/logout", () => {
  const originalDomain = process.env.COOKIE_DOMAIN;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    (process.env as Record<string, string>).NODE_ENV = "test";
    process.env.COOKIE_DOMAIN = ".lvh.me";
  });

  afterEach(() => {
    if (originalDomain === undefined) delete process.env.COOKIE_DOMAIN;
    else process.env.COOKIE_DOMAIN = originalDomain;
    (process.env as Record<string, string>).NODE_ENV = originalNodeEnv as string;
  });

  it("responds 200 and expires the session cookie in both scopes", async () => {
    const res = await POST();
    expect(res.status).toBe(200);

    const setCookies = res.headers.getSetCookie();
    expect(setCookies).toHaveLength(2);
    // Every emitted cookie is an expiry (Max-Age=0) of the dev session token.
    for (const c of setCookies) {
      expect(c).toContain("authjs.session-token=;");
      expect(c).toContain("Max-Age=0");
    }
    expect(setCookies.some((c) => !c.includes("Domain="))).toBe(true);
    expect(setCookies.some((c) => c.includes("Domain=.lvh.me"))).toBe(true);
  });
});

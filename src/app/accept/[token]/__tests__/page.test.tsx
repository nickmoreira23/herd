import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    networkProfile: { findUnique: vi.fn() },
    organizationInvitation: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/invitations/invitation-service", () => ({
  getInvitationByToken: vi.fn(),
}));
vi.mock("../accept-form", () => ({
  AcceptForm: (props: Record<string, unknown>) => props,
}));
vi.mock("../accepted-redirect", () => ({
  AcceptedRedirect: (props: Record<string, unknown>) => props,
}));
vi.mock("../views", () => ({
  InvitationNotFoundView: () => null,
  InvitationAlreadyProcessedView: (props: { status: string }) => props,
  InvitationExpiredView: () => null,
}));

import Page from "../page";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInvitationByToken } from "@/lib/invitations/invitation-service";
import {
  InvitationNotFoundView,
  InvitationAlreadyProcessedView,
  InvitationExpiredView,
} from "../views";
import { AcceptForm } from "../accept-form";
import { AcceptedRedirect } from "../accepted-redirect";

const mockAuth = vi.mocked(auth);
const mockGetInvitationByToken = vi.mocked(getInvitationByToken);
const mockProfileFindUnique = vi.mocked(prisma.networkProfile.findUnique);

function makeParams(token: string) {
  return { params: Promise.resolve({ token }) };
}

function makeInvitationData(overrides: Record<string, unknown> = {}) {
  return {
    invitation: {
      id: "inv-1",
      email: "user@test.com",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ...overrides,
    },
    organization: { id: "org-1", name: "Acme", subdomain: "acme" },
  };
}

describe("AcceptInvitationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders InvitationNotFoundView when token not found", async () => {
    mockGetInvitationByToken.mockResolvedValue(null);

    const element = await Page(makeParams("bad-token"));
    expect(element.type).toBe(InvitationNotFoundView);
  });

  it("renders AcceptedRedirect for ACCEPTED invitation (drives cross-subdomain nav client-side)", async () => {
    mockGetInvitationByToken.mockResolvedValue(
      makeInvitationData({ status: "ACCEPTED" }) as never
    );

    const element = await Page(makeParams("tok"));
    expect(element.type).toBe(AcceptedRedirect);
    expect(element.props.orgName).toBe("Acme");
    expect(element.props.redirectUrl).toContain("acme");
    expect(element.props.redirectUrl).toMatch(/\/admin$/);
  });

  it("renders InvitationAlreadyProcessedView for EXPIRED-status invitation", async () => {
    mockGetInvitationByToken.mockResolvedValue(
      makeInvitationData({ status: "EXPIRED" }) as never
    );

    const element = await Page(makeParams("tok"));
    expect(element.type).toBe(InvitationAlreadyProcessedView);
    expect(element.props.status).toBe("EXPIRED");
  });

  it("renders InvitationExpiredView for expired invitation", async () => {
    mockGetInvitationByToken.mockResolvedValue(
      makeInvitationData({ expiresAt: new Date(Date.now() - 1000) }) as never
    );

    const element = await Page(makeParams("tok"));
    expect(element.type).toBe(InvitationExpiredView);
  });

  it("renders AcceptForm for valid invitation (new user, no session)", async () => {
    mockGetInvitationByToken.mockResolvedValue(makeInvitationData() as never);
    mockAuth.mockResolvedValue(null as never);
    mockProfileFindUnique.mockResolvedValue(null);

    const element = await Page(makeParams("tok"));
    expect(element.type).toBe(AcceptForm);
    expect(element.props.profileExists).toBe(false);
    expect(element.props.sessionActive).toBe(false);
    expect(element.props.invitationEmail).toBe("user@test.com");
  });

  it("renders AcceptForm with profileExists=true when profile found", async () => {
    mockGetInvitationByToken.mockResolvedValue(makeInvitationData() as never);
    mockAuth.mockResolvedValue({ user: { id: "p1" } } as never);
    mockProfileFindUnique.mockResolvedValue({ id: "profile-1" } as never);

    const element = await Page(makeParams("tok"));
    expect(element.type).toBe(AcceptForm);
    expect(element.props.profileExists).toBe(true);
    expect(element.props.sessionActive).toBe(true);
  });
});

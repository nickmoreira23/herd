import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createInvitation,
  acceptInvitation,
  revokeInvitation,
  listPendingInvitations,
} from "../invitation-service";
import {
  InvitationAlreadyExistsError,
  InvitationNotFoundError,
  InvitationAlreadyProcessedError,
  InvitationExpiredError,
  InvitationNotRevocableError,
  InvitationPasswordRequiredError,
  InvitationPasswordTooShortError,
} from "../errors";
import { clearMockSentEmails, mockSentEmails, resetEmailProvider } from "@/lib/email";

// ─── Prisma mock ─────────────────────────────────────────────────────────────

const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockFindMany = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organizationInvitation: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    networkProfile: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    organization: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    organizationMember: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeInvitation(overrides: Record<string, unknown> = {}) {
  return {
    id: "inv-1",
    organizationId: "org-1",
    email: "user@test.com",
    role: "MEMBER" as const,
    status: "PENDING" as const,
    token: "token-abc",
    createdById: "profile-1",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    acceptedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── createInvitation ────────────────────────────────────────────────────────

describe("createInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearMockSentEmails();
    resetEmailProvider();
  });

  it("happy path: creates invitation and sends email", async () => {
    mockFindFirst.mockResolvedValueOnce(null); // no existing PENDING
    const created = makeInvitation();
    mockCreate.mockResolvedValueOnce(created);
    // org name lookup
    mockFindUnique
      .mockResolvedValueOnce({ name: "ComeçaAI" })
      // inviter name lookup
      .mockResolvedValueOnce({ firstName: "Nick", lastName: "Moreira" });

    const result = await createInvitation({
      organizationId: "org-1",
      email: "User@Test.com",
      role: "MEMBER",
      createdById: "profile-1",
    });

    expect(result).toBe(created);
    expect(mockSentEmails).toHaveLength(1);
    expect(mockSentEmails[0].to).toBe("user@test.com"); // normalized lowercase
    expect(mockSentEmails[0].subject).toContain("ComeçaAI");
    expect(mockSentEmails[0].text).toContain("Nick Moreira");
    expect(mockSentEmails[0].text).toContain("/accept/token-abc");
  });

  it("throws InvitationAlreadyExistsError when PENDING non-expired exists", async () => {
    mockFindFirst.mockResolvedValueOnce(makeInvitation()); // existing PENDING

    await expect(
      createInvitation({
        organizationId: "org-1",
        email: "user@test.com",
        role: "MEMBER",
        createdById: "profile-1",
      })
    ).rejects.toThrow(InvitationAlreadyExistsError);

    expect(mockSentEmails).toHaveLength(0);
  });

  it("allows new invitation when previous is ACCEPTED (not PENDING)", async () => {
    mockFindFirst.mockResolvedValueOnce(null); // no PENDING
    const created = makeInvitation();
    mockCreate.mockResolvedValueOnce(created);
    mockFindUnique
      .mockResolvedValueOnce({ name: "Acme" })
      .mockResolvedValueOnce({ firstName: "A", lastName: "B" });

    await expect(
      createInvitation({
        organizationId: "org-1",
        email: "user@test.com",
        role: "MEMBER",
        createdById: "profile-1",
      })
    ).resolves.toBe(created);
  });
});

// ─── acceptInvitation ────────────────────────────────────────────────────────

describe("acceptInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("existing profile: creates membership + marks ACCEPTED", async () => {
    const invitation = makeInvitation();
    const invitationWithOrg = { ...invitation, organization: { id: "org-1" } };
    mockFindUnique
      .mockResolvedValueOnce(invitationWithOrg) // find invitation by token
      .mockResolvedValueOnce({ id: "profile-2", email: "user@test.com" }) // find profile
      .mockResolvedValueOnce(null); // no existing membership

    const membership = { id: "mem-1", organizationId: "org-1" };
    mockTransaction.mockResolvedValueOnce([membership]);

    const result = await acceptInvitation({ token: "token-abc" });

    expect(result.profile.email).toBe("user@test.com");
    expect(result.membership).toBe(membership);
  });

  it("new profile + valid password: creates profile + membership", async () => {
    const invitation = makeInvitation();
    const invitationWithOrg = { ...invitation, organization: { id: "org-1" } };
    mockFindUnique
      .mockResolvedValueOnce(invitationWithOrg) // invitation
      .mockResolvedValueOnce(null) // no profile
      .mockResolvedValueOnce(null); // no existing membership

    const newProfile = { id: "profile-3", email: "user@test.com" };
    mockCreate.mockResolvedValueOnce(newProfile); // profile create

    const membership = { id: "mem-2", organizationId: "org-1" };
    mockTransaction.mockResolvedValueOnce([membership]);

    const result = await acceptInvitation({ token: "token-abc", password: "password123" });

    expect(result.profile).toBe(newProfile);
    expect(result.membership).toBe(membership);
  });

  it("new profile + missing password throws InvitationPasswordRequiredError", async () => {
    const invitation = makeInvitation();
    const invitationWithOrg = { ...invitation, organization: { id: "org-1" } };
    mockFindUnique
      .mockResolvedValueOnce(invitationWithOrg)
      .mockResolvedValueOnce(null); // no profile

    await expect(acceptInvitation({ token: "token-abc" })).rejects.toThrow(
      InvitationPasswordRequiredError
    );
  });

  it("new profile + short password throws InvitationPasswordTooShortError", async () => {
    const invitation = makeInvitation();
    const invitationWithOrg = { ...invitation, organization: { id: "org-1" } };
    mockFindUnique
      .mockResolvedValueOnce(invitationWithOrg)
      .mockResolvedValueOnce(null); // no profile

    await expect(
      acceptInvitation({ token: "token-abc", password: "short" })
    ).rejects.toThrow(InvitationPasswordTooShortError);
  });

  it("expired token: mutates to EXPIRED + throws InvitationExpiredError", async () => {
    const expired = makeInvitation({
      expiresAt: new Date(Date.now() - 1000),
    });
    const invitationWithOrg = { ...expired, organization: { id: "org-1" } };
    mockFindUnique.mockResolvedValueOnce(invitationWithOrg);
    mockUpdate.mockResolvedValueOnce({ ...expired, status: "EXPIRED" });

    await expect(acceptInvitation({ token: "token-abc" })).rejects.toThrow(
      InvitationExpiredError
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "EXPIRED" } })
    );
  });

  it("ACCEPTED invitation throws InvitationAlreadyProcessedError", async () => {
    const accepted = makeInvitation({ status: "ACCEPTED" });
    const invitationWithOrg = { ...accepted, organization: { id: "org-1" } };
    mockFindUnique.mockResolvedValueOnce(invitationWithOrg);

    await expect(acceptInvitation({ token: "token-abc" })).rejects.toThrow(
      InvitationAlreadyProcessedError
    );
  });

  it("idempotency: already ACTIVE member marks ACCEPTED without duplicating membership", async () => {
    const invitation = makeInvitation();
    const invitationWithOrg = { ...invitation, organization: { id: "org-1" } };
    mockFindUnique
      .mockResolvedValueOnce(invitationWithOrg) // invitation
      .mockResolvedValueOnce({ id: "profile-2", email: "user@test.com" }) // profile
      .mockResolvedValueOnce({ id: "mem-existing", organizationId: "org-1", status: "ACTIVE" }); // existing membership

    mockUpdate.mockResolvedValueOnce({ ...invitation, status: "ACCEPTED" });

    const result = await acceptInvitation({ token: "token-abc" });

    expect(result.membership.id).toBe("mem-existing");
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "ACCEPTED", acceptedAt: expect.any(Date) } })
    );
  });

  it("token not found throws InvitationNotFoundError", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    await expect(acceptInvitation({ token: "bad-token" })).rejects.toThrow(
      InvitationNotFoundError
    );
  });
});

// ─── revokeInvitation ────────────────────────────────────────────────────────

describe("revokeInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("happy path: sets expiresAt = now()", async () => {
    mockFindFirst.mockResolvedValueOnce(makeInvitation());
    mockUpdate.mockResolvedValueOnce({});

    await revokeInvitation({ token: "token-abc", organizationId: "org-1" });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { expiresAt: expect.any(Date) },
      })
    );
    // expiresAt should be approximately now
    const callArgs = mockUpdate.mock.calls[0][0];
    const diff = Math.abs(callArgs.data.expiresAt.getTime() - Date.now());
    expect(diff).toBeLessThan(1000);
  });

  it("throws InvitationNotFoundError when not found", async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    await expect(
      revokeInvitation({ token: "token-not-found", organizationId: "org-1" })
    ).rejects.toThrow(InvitationNotFoundError);
  });

  it("throws InvitationNotRevocableError when already ACCEPTED", async () => {
    mockFindFirst.mockResolvedValueOnce(makeInvitation({ status: "ACCEPTED" }));
    await expect(
      revokeInvitation({ token: "token-abc", organizationId: "org-1" })
    ).rejects.toThrow(InvitationNotRevocableError);
  });
});

// ─── listPendingInvitations ──────────────────────────────────────────────────

describe("listPendingInvitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns pending non-expired invitations ordered by createdAt desc", async () => {
    const invitations = [makeInvitation(), makeInvitation({ id: "inv-2" })];
    mockFindMany.mockResolvedValueOnce(invitations);

    const result = await listPendingInvitations("org-1");
    expect(result).toBe(invitations);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1", status: "PENDING" }),
        orderBy: { createdAt: "desc" },
      })
    );
  });
});

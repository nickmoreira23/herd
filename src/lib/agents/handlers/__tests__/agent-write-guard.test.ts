import { describe, it, expect, vi, beforeEach } from "vitest";

// L1.0b — characterization of the agent-dispatcher catalog-write guard.
// Specialist agents (plans-architect, projections-architect) gate their
// catalog-mutating tools behind canWriteCatalog (OWNER/ADMIN, resolved at the
// route). Read-tools stay open. Refusal is a clean tool-result string via the
// agent channel — no exception, no DB mutation.

function delegate() {
  return {
    findUnique: vi.fn(async () => null),
    findFirst: vi.fn(async () => null),
    findMany: vi.fn(async () => []),
    create: vi.fn(async () => ({ id: "x" })),
    update: vi.fn(async () => ({ id: "x" })),
    delete: vi.fn(async () => ({ id: "x" })),
    createMany: vi.fn(async () => ({ count: 0 })),
    deleteMany: vi.fn(async () => ({ count: 0 })),
  };
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscriptionTier: delegate(),
    subscriptionRedemptionRule: delegate(),
    agentTierAccess: delegate(),
    perkTierAssignment: delegate(),
    communityBenefitTierAssignment: delegate(),
    product: delegate(),
    financialSnapshot: delegate(),
  },
}));

vi.mock("@/lib/financial-engine", () => ({
  calculateScenario: vi.fn(() => ({ mrr: 0, netMarginPercent: 0 })),
}));

// L1a.2 — search_products now reads the host org's catalog under withTenant.
vi.mock("@/lib/tenant/get-org-from-request", () => ({
  getOrgIdFromRequest: vi.fn(async () => "org-1"),
}));
vi.mock("@/lib/tenancy/context", () => ({
  withTenant: vi.fn(async (_tenantId: string, fn: () => unknown) => fn()),
}));

const { prisma } = await import("@/lib/prisma");
const { handlePlanAgentToolCall } = await import("../plan-agent");
const { handleProjectionsToolCall } = await import("../projections-agent");

const REFUSAL = /OWNER or ADMIN/;

// Minimal valid-ish input per writer tool (enough to reach the mutation when
// allowed; the gate short-circuits before any of it when denied).
const PLAN_WRITERS: Array<{ tool: string; input: Record<string, unknown> }> = [
  { tool: "update_plan_fields", input: { planId: "p1", fields: { monthlyPrice: 10 } } },
  {
    tool: "create_discount_rule",
    input: {
      planId: "p1",
      redemptionType: "MEMBERS_STORE",
      discountPercent: 10,
      scopeType: "CATEGORY",
      scopeValue: "SUPPLEMENT",
    },
  },
  { tool: "delete_discount_rule", input: { ruleId: "r1" } },
  { tool: "manage_agent_access", input: { planId: "p1", agentIds: [] } },
  { tool: "manage_perks", input: { planId: "p1", assignments: [] } },
  { tool: "manage_community", input: { planId: "p1", assignments: [] } },
];

const PROJECTIONS_WRITERS: Array<{ tool: string; input: Record<string, unknown> }> = [
  { tool: "save_scenario", input: { name: "S", inputs: {} } },
  { tool: "delete_scenario", input: { scenarioId: "s1" } },
];

describe("L1.0b — plans-architect write guard", () => {
  beforeEach(() => vi.clearAllMocks());

  for (const { tool, input } of PLAN_WRITERS) {
    it(`refuses "${tool}" when canWriteCatalog=false (no mutation)`, async () => {
      const send = vi.fn();
      const out = await handlePlanAgentToolCall(tool, input, send, [], false);
      expect(out).toMatch(REFUSAL);
      expect(send).toHaveBeenCalledWith("step_complete", { text: "Permission denied" });
      // No catalog mutation happened.
      expect(prisma.subscriptionTier.update).not.toHaveBeenCalled();
      expect(prisma.subscriptionRedemptionRule.create).not.toHaveBeenCalled();
      expect(prisma.subscriptionRedemptionRule.delete).not.toHaveBeenCalled();
      expect(prisma.agentTierAccess.createMany).not.toHaveBeenCalled();
      expect(prisma.perkTierAssignment.createMany).not.toHaveBeenCalled();
      expect(prisma.communityBenefitTierAssignment.createMany).not.toHaveBeenCalled();
    });
  }

  it("defaults to denied when canWriteCatalog omitted (fail-closed)", async () => {
    const send = vi.fn();
    const out = await handlePlanAgentToolCall("update_plan_fields", {
      planId: "p1",
      fields: { monthlyPrice: 10 },
    }, send, []);
    expect(out).toMatch(REFUSAL);
    expect(prisma.subscriptionTier.update).not.toHaveBeenCalled();
  });

  it("executes a writer when canWriteCatalog=true", async () => {
    const send = vi.fn();
    const out = await handlePlanAgentToolCall(
      "update_plan_fields",
      { planId: "p1", fields: { monthlyPrice: 10 } },
      send,
      [],
      true
    );
    expect(out).not.toMatch(REFUSAL);
    expect(prisma.subscriptionTier.update).toHaveBeenCalledOnce();
  });

  it("read-tool (search_products) works when canWriteCatalog=false", async () => {
    const send = vi.fn();
    const out = await handlePlanAgentToolCall("search_products", {}, send, [], false);
    expect(out).not.toMatch(REFUSAL);
    expect(prisma.product.findMany).toHaveBeenCalled();
  });
});

describe("L1.0b — projections-architect write guard", () => {
  beforeEach(() => vi.clearAllMocks());

  for (const { tool, input } of PROJECTIONS_WRITERS) {
    it(`refuses "${tool}" when canWriteCatalog=false (no mutation)`, async () => {
      const send = vi.fn();
      const out = await handleProjectionsToolCall(tool, input, send, false);
      expect(out).toMatch(REFUSAL);
      expect(send).toHaveBeenCalledWith("step_complete", { text: "Permission denied" });
      expect(prisma.financialSnapshot.create).not.toHaveBeenCalled();
      expect(prisma.financialSnapshot.update).not.toHaveBeenCalled();
      expect(prisma.financialSnapshot.delete).not.toHaveBeenCalled();
    });
  }

  it("defaults to denied when canWriteCatalog omitted (fail-closed)", async () => {
    const send = vi.fn();
    const out = await handleProjectionsToolCall("delete_scenario", { scenarioId: "s1" }, send);
    expect(out).toMatch(REFUSAL);
    expect(prisma.financialSnapshot.delete).not.toHaveBeenCalled();
  });

  it("executes a writer (delete_scenario) when canWriteCatalog=true", async () => {
    vi.mocked(prisma.financialSnapshot.findUnique).mockResolvedValueOnce({
      scenarioName: "S",
    } as never);
    const send = vi.fn();
    const out = await handleProjectionsToolCall(
      "delete_scenario",
      { scenarioId: "s1" },
      send,
      true
    );
    expect(out).not.toMatch(REFUSAL);
    expect(prisma.financialSnapshot.delete).toHaveBeenCalledOnce();
  });

  it("read-tool (list_scenarios) works when canWriteCatalog=false", async () => {
    const send = vi.fn();
    const out = await handleProjectionsToolCall("list_scenarios", {}, send, false);
    expect(out).not.toMatch(REFUSAL);
    expect(prisma.financialSnapshot.findMany).toHaveBeenCalled();
  });
});

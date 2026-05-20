import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHmac } from "node:crypto";
import { processPendingEvents } from "@/lib/domain-events/process-pending-events";
import { withTenant } from "@/lib/tenancy/context";

/**
 * Sub-etapa 6, Tarefa 4 — Gorgias end-to-end.
 *
 * Flow: signed POST → HMAC verify → dedup row + outbox event in one tx →
 * 200 accepted. Worker picks the event → handler runs withTenant → IWE row
 * created. Replay of the same payload → dedup hit → 200 duplicate without
 * touching the outbox or IWE.
 *
 * Env var note: the route module reads `GORGIAS_WEBHOOK_SECRET` at import
 * time. We set it BEFORE the dynamic import to guarantee the verifier is
 * constructed with a known test secret.
 */

const TEST_GORGIAS_SECRET = "test-gorgias-e2e-secret-deterministic";

// Set the env BEFORE the route module is loaded. The route's verifier is
// constructed once at module top — we must beat that import.
process.env.GORGIAS_WEBHOOK_SECRET = TEST_GORGIAS_SECRET;

const adminUrl = process.env.DATABASE_URL;
const runtimeUrl = process.env.RUNTIME_DATABASE_URL ?? process.env.DIRECT_URL;
if (!adminUrl) throw new Error("DATABASE_URL required (admin seed/cleanup)");
if (!runtimeUrl) throw new Error("RUNTIME_DATABASE_URL or DIRECT_URL required");

const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });
const runtimeClient = new PrismaClient({ adapter: new PrismaPg(runtimeUrl) });

const TEST_PREFIX = `test-gorgias-e2e-${Date.now()}`;
const ACCOUNT_ID = `${TEST_PREFIX}-acct`;
const EVENT_ID = `${TEST_PREFIX}-evt`;
const EVENT_TYPE = "ticket.created";

type POSTFn = (req: Request) => Promise<Response>;
let POST: POSTFn;

type Seeded = {
  profile: { id: string };
  org: { id: string };
  integration: { id: string; created: boolean };
  connection: { id: string };
};

let seeded: Seeded;

function signGorgias(body: Buffer, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function buildPayload(eventId: string): {
  body: Buffer;
  parsed: Record<string, unknown>;
} {
  const parsed = {
    id: eventId,
    account_id: ACCOUNT_ID,
    event: EVENT_TYPE,
    data: { ticket_id: 12345, subject: "Test" },
  };
  return { body: Buffer.from(JSON.stringify(parsed)), parsed };
}

function buildRequest(rawBody: Buffer, signature: string): Request {
  return new Request("http://test.local/api/webhooks/gorgias", {
    method: "POST",
    body: new Uint8Array(rawBody),
    headers: {
      "content-type": "application/json",
      "x-gorgias-signature": signature,
    },
  });
}

async function seed(): Promise<Seeded> {
  // NetworkProfileType removed in Sub-etapa 3.6.

  const profile = await adminClient.networkProfile.create({
    data: {
      firstName: "GorgiasE2E",
      lastName: "Owner",
      email: `${TEST_PREFIX}@example.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const org = await adminClient.organization.create({
    data: { ownerId: profile.id, slug: TEST_PREFIX, name: "Gorgias E2E" },
    select: { id: true },
  });

  // Gorgias integration: reuse if present, else create + mark for cleanup.
  let integration = await adminClient.integration.findUnique({
    where: { slug: "gorgias" },
    select: { id: true },
  });
  let createdIntegration = false;
  if (!integration) {
    integration = await adminClient.integration.create({
      data: {
        name: "Gorgias",
        slug: "gorgias",
        category: "OTHER",
      },
      select: { id: true },
    });
    createdIntegration = true;
  }

  const connection = await adminClient.memberConnection.create({
    data: {
      tenantId: org.id,
      profileId: profile.id,
      integrationId: integration.id,
      externalUserId: ACCOUNT_ID,
    },
    select: { id: true },
  });

  return {
    profile,
    org,
    integration: { id: integration.id, created: createdIntegration },
    connection,
  };
}

async function cleanup() {
  // Remove webhook artefacts first — IWE references integration, dedup is
  // standalone, domain_events is platform-wide.
  await adminClient.integrationWebhookEvent.deleteMany({
    where: { integrationId: seeded.integration.id },
  });
  await adminClient.domainEvent.deleteMany({
    where: { aggregateId: seeded.org.id, eventType: "webhook.gorgias" },
  });
  await adminClient.webhookDedup.deleteMany({
    where: { provider: "gorgias", eventId: { startsWith: TEST_PREFIX } },
  });
  await adminClient.memberConnection.delete({
    where: { id: seeded.connection.id },
  });
  if (seeded.integration.created) {
    await adminClient.integration.delete({
      where: { id: seeded.integration.id },
    });
  }
  await adminClient.organization.delete({ where: { id: seeded.org.id } });
  await adminClient.networkProfile.delete({ where: { id: seeded.profile.id } });
  // NetworkProfileType removed in Sub-etapa 3.6
}

describe("Gorgias webhook e2e (verify → dedup → outbox → worker → IWE)", () => {
  beforeAll(async () => {
    // Dynamic import AFTER env is set so the route's module-level verifier
    // captures the test secret.
    const mod = await import("@/app/api/webhooks/gorgias/route");
    POST = mod.POST as POSTFn;
    seeded = await seed();
  });

  afterAll(async () => {
    await cleanup();
    await adminClient.$disconnect();
    await runtimeClient.$disconnect();
  });

  it("first delivery: 200 accepted, dedup row + outbox event created", async () => {
    const { body, parsed } = buildPayload(EVENT_ID);
    const sig = signGorgias(body, TEST_GORGIAS_SECRET);
    const req = buildRequest(body, sig);

    const t0 = Date.now();
    const res = await POST(req);
    const elapsedMs = Date.now() - t0;
    const json = (await res.json()) as { data?: { status?: string } };

    expect(res.status).toBe(200);
    expect(json.data?.status).toBe("accepted");
    // Ack-time visibility: target is <500ms (Sub-etapa 6 decision #2).
    // Not asserted as a hard ceiling — Supabase pooler cold-start adds
    // ~1-2s on first request from a test environment, and CI/network
    // latency is non-deterministic. Real-world DEV perf is the gate;
    // this log surfaces regressions when running locally.
    // eslint-disable-next-line no-console
    console.log(`[gorgias e2e] first-delivery ack: ${elapsedMs}ms`);

    // Suppress unused-var warning on parsed (used later in dedup assertion).
    void parsed;

    const dedup = await adminClient.webhookDedup.findUnique({
      where: { provider_eventId: { provider: "gorgias", eventId: EVENT_ID } },
    });
    expect(dedup).not.toBeNull();

    const events = await adminClient.domainEvent.findMany({
      where: { eventType: "webhook.gorgias", aggregateId: seeded.org.id },
    });
    expect(events).toHaveLength(1);
    expect(events[0].processedAt).toBeNull();
    const payload = events[0].payload as Record<string, unknown>;
    expect(payload.gorgias_event_id).toBe(EVENT_ID);
    expect(payload.gorgias_event_type).toBe(EVENT_TYPE);
    expect(payload.tenantId).toBe(seeded.org.id);
  });

  it("worker run: handler processes event → IWE row created in tenant scope", async () => {
    // Worker picks the event from the prior test (same suite, ordered).
    const result = await processPendingEvents({ limit: 10 });
    expect(result.picked).toBeGreaterThanOrEqual(1);
    // The Gorgias event must succeed; other unrelated pending events may also
    // run and the assertion below scopes to our org.
    expect(result.failed).toBe(0);
    expect(result.exhausted).toBe(0);

    // Verify the outbox row is now marked processed.
    const events = await adminClient.domainEvent.findMany({
      where: { eventType: "webhook.gorgias", aggregateId: seeded.org.id },
    });
    expect(events).toHaveLength(1);
    expect(events[0].processedAt).not.toBeNull();
    expect(events[0].lastError).toBeNull();

    // Verify the IWE row was written under the correct tenant. Use runtime
    // client + withTenant + the prod scoping extension semantics: only the
    // current tenant's rows are visible.
    const { createTenantScopingExtension } = await import(
      "@/lib/tenancy/prisma-extension"
    );
    const scoped = runtimeClient.$extends(
      createTenantScopingExtension(["IntegrationWebhookEvent"]),
    );

    const iweRows = await withTenant(seeded.org.id, () =>
      scoped.integrationWebhookEvent.findMany({
        where: { integrationId: seeded.integration.id },
      }),
    );
    expect(iweRows).toHaveLength(1);
    expect(iweRows[0].eventType).toBe(EVENT_TYPE);
    const iwePayload = JSON.parse(iweRows[0].payload) as Record<string, unknown>;
    expect(iwePayload.id).toBe(EVENT_ID);
  });

  it("replay same payload: dedup hit, 200 duplicate, no new outbox event", async () => {
    const { body } = buildPayload(EVENT_ID);
    const sig = signGorgias(body, TEST_GORGIAS_SECRET);
    const req = buildRequest(body, sig);

    const res = await POST(req);
    const json = (await res.json()) as { data?: { status?: string } };

    expect(res.status).toBe(200);
    expect(json.data?.status).toBe("duplicate");

    // No new outbox event created — still exactly one for this org.
    const events = await adminClient.domainEvent.findMany({
      where: { eventType: "webhook.gorgias", aggregateId: seeded.org.id },
    });
    expect(events).toHaveLength(1);
  });

  it("invalid signature: 401 without touching dedup or outbox", async () => {
    const otherEventId = `${TEST_PREFIX}-evt-bad`;
    const { body } = buildPayload(otherEventId);
    const badSig = signGorgias(body, "wrong-secret");
    const req = buildRequest(body, badSig);

    const res = await POST(req);
    expect(res.status).toBe(401);

    const dedup = await adminClient.webhookDedup.findUnique({
      where: {
        provider_eventId: { provider: "gorgias", eventId: otherEventId },
      },
    });
    expect(dedup).toBeNull();

    const events = await adminClient.domainEvent.findMany({
      where: { eventType: "webhook.gorgias", aggregateId: seeded.org.id },
    });
    expect(events).toHaveLength(1); // unchanged from prior tests
  });

  it("missing payload.id: 400 without touching dedup or outbox", async () => {
    const parsed = {
      account_id: ACCOUNT_ID,
      event: EVENT_TYPE,
      data: { ticket_id: 99 },
      // no `id` field
    };
    const body = Buffer.from(JSON.stringify(parsed));
    const sig = signGorgias(body, TEST_GORGIAS_SECRET);
    const req = buildRequest(body, sig);

    const res = await POST(req);
    expect(res.status).toBe(400);

    const events = await adminClient.domainEvent.findMany({
      where: { eventType: "webhook.gorgias", aggregateId: seeded.org.id },
    });
    expect(events).toHaveLength(1); // unchanged
  });
});

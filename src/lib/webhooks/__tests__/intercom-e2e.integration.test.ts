import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHmac } from "node:crypto";
import { processPendingEvents } from "@/lib/domain-events/process-pending-events";
import { withTenant } from "@/lib/tenancy/context";

/**
 * Sub-etapa 8 — Intercom end-to-end.
 *
 * Mirrors `gorgias-e2e.integration.test.ts` (Sub-etapa 6, Tarefa 4) point
 * for point. If this suite ever drifts from the Gorgias one in structure,
 * something is off — bring them back into sync first.
 *
 * Flow: signed POST → HMAC-SHA256 (sha256= prefix) verify → dedup row +
 * outbox event in one tx → 200 accepted. Worker picks the event → handler
 * runs withTenant → IWE row created in tenant scope. Replay → dedup hit →
 * 200 duplicate.
 *
 * Env var: route reads `INTERCOM_WEBHOOK_SECRET` at module load — set it
 * before the dynamic import.
 */

const TEST_INTERCOM_SECRET = "test-intercom-e2e-secret-deterministic";

process.env.INTERCOM_WEBHOOK_SECRET = TEST_INTERCOM_SECRET;

const adminUrl = process.env.DATABASE_URL;
const runtimeUrl = process.env.RUNTIME_DATABASE_URL ?? process.env.DIRECT_URL;
if (!adminUrl) throw new Error("DATABASE_URL required (admin seed/cleanup)");
if (!runtimeUrl) throw new Error("RUNTIME_DATABASE_URL or DIRECT_URL required");

const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });
const runtimeClient = new PrismaClient({ adapter: new PrismaPg(runtimeUrl) });

const TEST_PREFIX = `test-intercom-e2e-${Date.now()}`;
const APP_ID = `${TEST_PREFIX}-app`;
const EVENT_ID = `${TEST_PREFIX}-evt`;
const TOPIC = "conversation.user.replied";

type POSTFn = (req: Request) => Promise<Response>;
let POST: POSTFn;

type Seeded = {
  profile: { id: string };
  org: { id: string };
  integration: { id: string; created: boolean };
  connection: { id: string };
};

let seeded: Seeded;

function signIntercom(body: Buffer, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

function buildPayload(eventId: string): {
  body: Buffer;
  parsed: Record<string, unknown>;
} {
  const parsed = {
    id: eventId,
    type: "notification_event",
    app_id: APP_ID,
    topic: TOPIC,
    data: {
      item: { id: "conv-123", type: "conversation", state: "open" },
    },
  };
  return { body: Buffer.from(JSON.stringify(parsed)), parsed };
}

function buildRequest(rawBody: Buffer, signature: string): Request {
  return new Request("http://test.local/api/webhooks/intercom", {
    method: "POST",
    body: new Uint8Array(rawBody),
    headers: {
      "content-type": "application/json",
      "x-hub-signature": signature,
    },
  });
}

async function seed(): Promise<Seeded> {
  // NetworkProfileType removed in Sub-etapa 3.6.

  const profile = await adminClient.networkProfile.create({
    data: {
      firstName: "IntercomE2E",
      lastName: "Owner",
      email: `${TEST_PREFIX}@example.com`,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const org = await adminClient.organization.create({
    data: { ownerId: profile.id, slug: TEST_PREFIX, name: "Intercom E2E" },
    select: { id: true },
  });

  let integration = await adminClient.integration.findUnique({
    where: { slug: "intercom" },
    select: { id: true },
  });
  let createdIntegration = false;
  if (!integration) {
    integration = await adminClient.integration.create({
      data: {
        name: "Intercom",
        slug: "intercom",
        category: "COMMUNICATION",
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
      externalUserId: APP_ID,
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
  await adminClient.integrationWebhookEvent.deleteMany({
    where: { integrationId: seeded.integration.id },
  });
  await adminClient.domainEvent.deleteMany({
    where: { aggregateId: seeded.org.id, eventType: "webhook.intercom" },
  });
  await adminClient.webhookDedup.deleteMany({
    where: { provider: "intercom", eventId: { startsWith: TEST_PREFIX } },
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

describe("Intercom webhook e2e (verify → dedup → outbox → worker → IWE)", () => {
  beforeAll(async () => {
    const mod = await import("@/app/api/webhooks/intercom/route");
    POST = mod.POST as POSTFn;
    seeded = await seed();
  });

  afterAll(async () => {
    await cleanup();
    await adminClient.$disconnect();
    await runtimeClient.$disconnect();
  });

  it("first delivery: 200 accepted, dedup row + outbox event created", async () => {
    const { body } = buildPayload(EVENT_ID);
    const sig = signIntercom(body, TEST_INTERCOM_SECRET);
    const req = buildRequest(body, sig);

    const t0 = Date.now();
    const res = await POST(req);
    const elapsedMs = Date.now() - t0;
    const json = (await res.json()) as { data?: { status?: string } };

    expect(res.status).toBe(200);
    expect(json.data?.status).toBe("accepted");
    // eslint-disable-next-line no-console
    console.log(`[intercom e2e] first-delivery ack: ${elapsedMs}ms`);

    const dedup = await adminClient.webhookDedup.findUnique({
      where: { provider_eventId: { provider: "intercom", eventId: EVENT_ID } },
    });
    expect(dedup).not.toBeNull();

    const events = await adminClient.domainEvent.findMany({
      where: { eventType: "webhook.intercom", aggregateId: seeded.org.id },
    });
    expect(events).toHaveLength(1);
    expect(events[0].processedAt).toBeNull();
    const payload = events[0].payload as Record<string, unknown>;
    expect(payload.intercom_event_id).toBe(EVENT_ID);
    expect(payload.intercom_topic).toBe(TOPIC);
    expect(payload.tenantId).toBe(seeded.org.id);
  });

  it("worker run: handler processes event → IWE row created in tenant scope", async () => {
    const result = await processPendingEvents({ limit: 10 });
    expect(result.picked).toBeGreaterThanOrEqual(1);
    expect(result.failed).toBe(0);
    expect(result.exhausted).toBe(0);

    const events = await adminClient.domainEvent.findMany({
      where: { eventType: "webhook.intercom", aggregateId: seeded.org.id },
    });
    expect(events).toHaveLength(1);
    expect(events[0].processedAt).not.toBeNull();
    expect(events[0].lastError).toBeNull();

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
    expect(iweRows[0].eventType).toBe(TOPIC);
    const iwePayload = JSON.parse(iweRows[0].payload) as Record<string, unknown>;
    expect(iwePayload.id).toBe(EVENT_ID);
  });

  it("replay same payload: dedup hit, 200 duplicate, no new outbox event", async () => {
    const { body } = buildPayload(EVENT_ID);
    const sig = signIntercom(body, TEST_INTERCOM_SECRET);
    const req = buildRequest(body, sig);

    const res = await POST(req);
    const json = (await res.json()) as { data?: { status?: string } };

    expect(res.status).toBe(200);
    expect(json.data?.status).toBe("duplicate");

    const events = await adminClient.domainEvent.findMany({
      where: { eventType: "webhook.intercom", aggregateId: seeded.org.id },
    });
    expect(events).toHaveLength(1);
  });

  it("invalid signature: 401 without touching dedup or outbox", async () => {
    const otherEventId = `${TEST_PREFIX}-evt-bad`;
    const { body } = buildPayload(otherEventId);
    const badSig = signIntercom(body, "wrong-secret");
    const req = buildRequest(body, badSig);

    const res = await POST(req);
    expect(res.status).toBe(401);

    const dedup = await adminClient.webhookDedup.findUnique({
      where: {
        provider_eventId: { provider: "intercom", eventId: otherEventId },
      },
    });
    expect(dedup).toBeNull();

    const events = await adminClient.domainEvent.findMany({
      where: { eventType: "webhook.intercom", aggregateId: seeded.org.id },
    });
    expect(events).toHaveLength(1);
  });

  it("missing payload.id: 400 without touching dedup or outbox", async () => {
    const parsed = {
      // no `id` field
      type: "notification_event",
      app_id: APP_ID,
      topic: TOPIC,
      data: { item: { id: "conv-999" } },
    };
    const body = Buffer.from(JSON.stringify(parsed));
    const sig = signIntercom(body, TEST_INTERCOM_SECRET);
    const req = buildRequest(body, sig);

    const res = await POST(req);
    expect(res.status).toBe(400);

    const events = await adminClient.domainEvent.findMany({
      where: { eventType: "webhook.intercom", aggregateId: seeded.org.id },
    });
    expect(events).toHaveLength(1);
  });
});

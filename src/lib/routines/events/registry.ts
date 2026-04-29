/**
 * Catalog of events that other blocks emit. The Routines wizard uses this
 * to populate the EVENT trigger pickers; the dispatcher uses the same
 * `blockName.eventType` strings emitted from the API handlers.
 *
 * Adding a new event type means: (1) push an entry here with i18n keys
 * and example payload, (2) call `dispatchBlockEvent("block","type",payload)`
 * from the API handler that mutates state.
 */

import type { MessageKey } from "@/lib/i18n/t";

type EventMessageKey = MessageKey | (string & {});

export interface EventPayloadField {
  /** Field name in the dispatched payload */
  name: string;
  /** "string" | "number" | "boolean" | "uuid" | "datetime" | "json" */
  type: string;
  /** Short human note shown next to the variable in the wizard */
  description: string;
}

export interface BlockEvent {
  blockName: string;
  eventType: string;
  /** i18n key for the event's display label (e.g. "Won deal") */
  displayKey: EventMessageKey;
  /** i18n key for the event's longer description */
  descriptionKey: EventMessageKey;
  /** Documented fields the dispatcher includes in the payload */
  payload: EventPayloadField[];
  /** Sample payload used by the wizard's "Test render" panel */
  examplePayload: Record<string, unknown>;
  /** True when the dispatcher is wired up; false = registry-only (TODO) */
  wired: boolean;
}

export const BLOCK_EVENTS: BlockEvent[] = [
  // ── deals ────────────────────────────────────────────────────────
  {
    blockName: "deals",
    eventType: "created",
    displayKey: "events.deals.created.label",
    descriptionKey: "events.deals.created.description",
    payload: [
      { name: "dealId", type: "uuid", description: "ID of the new deal" },
      { name: "title", type: "string", description: "Deal title" },
      { name: "stage", type: "string", description: "Initial stage" },
      { name: "amount", type: "string", description: "Decimal amount, may be null" },
      { name: "currency", type: "string", description: "ISO currency code" },
    ],
    examplePayload: {
      dealId: "11111111-2222-3333-4444-555555555555",
      title: "Acme expansion Q3",
      stage: "LEAD",
      amount: "15000.00",
      currency: "BRL",
    },
    wired: true,
  },
  {
    blockName: "deals",
    eventType: "updated",
    displayKey: "events.deals.updated.label",
    descriptionKey: "events.deals.updated.description",
    payload: [
      { name: "dealId", type: "uuid", description: "Deal ID" },
      { name: "title", type: "string", description: "Current title" },
      { name: "stage", type: "string", description: "Current stage" },
    ],
    examplePayload: { dealId: "uuid", title: "Acme expansion Q3", stage: "PROPOSAL" },
    wired: true,
  },
  {
    blockName: "deals",
    eventType: "deleted",
    displayKey: "events.deals.deleted.label",
    descriptionKey: "events.deals.deleted.description",
    payload: [{ name: "dealId", type: "uuid", description: "Deleted deal ID" }],
    examplePayload: { dealId: "uuid" },
    wired: true,
  },
  ...[
    ["lead", "Lead"],
    ["qualified", "Qualified"],
    ["proposal", "Proposal"],
    ["negotiation", "Negotiation"],
    ["won", "Won"],
    ["lost", "Lost"],
  ].map(
    ([slug]) =>
      ({
        blockName: "deals",
        eventType: `stage_changed_to_${slug}`,
        displayKey: `events.deals.stage_changed_to_${slug}.label` as MessageKey,
        descriptionKey:
          `events.deals.stage_changed_to_${slug}.description` as MessageKey,
        payload: [
          { name: "dealId", type: "uuid", description: "Deal ID" },
          { name: "title", type: "string", description: "Deal title" },
          { name: "previousStage", type: "string", description: "Stage before the transition" },
          { name: "stage", type: "string", description: `Always "${slug.toUpperCase()}"` },
          { name: "amount", type: "string", description: "Decimal amount, may be null" },
          { name: "currency", type: "string", description: "ISO currency code" },
          { name: "contactId", type: "uuid", description: "Linked contact, may be null" },
          { name: "companyId", type: "uuid", description: "Linked company, may be null" },
          { name: "campaignId", type: "uuid", description: "Linked campaign, may be null" },
        ],
        examplePayload: {
          dealId: "uuid",
          title: "Acme expansion Q3",
          previousStage: "PROPOSAL",
          stage: slug.toUpperCase(),
          amount: "15000.00",
          currency: "BRL",
          contactId: null,
          companyId: "uuid",
          campaignId: null,
        },
        wired: true,
      }) as BlockEvent
  ),

  // ── contacts ─────────────────────────────────────────────────────
  {
    blockName: "contacts",
    eventType: "created",
    displayKey: "events.contacts.created.label",
    descriptionKey: "events.contacts.created.description",
    payload: [
      { name: "contactId", type: "uuid", description: "Contact ID" },
      { name: "firstName", type: "string", description: "First name" },
      { name: "lastName", type: "string", description: "Last name, may be null" },
      { name: "email", type: "string", description: "Email, may be null" },
      { name: "companyId", type: "uuid", description: "Linked company, may be null" },
    ],
    examplePayload: {
      contactId: "uuid",
      firstName: "Maria",
      lastName: "Silva",
      email: "maria@empresa.com",
      companyId: null,
    },
    wired: true,
  },
  {
    blockName: "contacts",
    eventType: "updated",
    displayKey: "events.contacts.updated.label",
    descriptionKey: "events.contacts.updated.description",
    payload: [
      { name: "contactId", type: "uuid", description: "Contact ID" },
      { name: "firstName", type: "string", description: "First name" },
      { name: "email", type: "string", description: "Email, may be null" },
    ],
    examplePayload: { contactId: "uuid", firstName: "Maria", email: "maria@empresa.com" },
    wired: true,
  },
  {
    blockName: "contacts",
    eventType: "deleted",
    displayKey: "events.contacts.deleted.label",
    descriptionKey: "events.contacts.deleted.description",
    payload: [{ name: "contactId", type: "uuid", description: "Deleted contact ID" }],
    examplePayload: { contactId: "uuid" },
    wired: true,
  },

  // ── companies ────────────────────────────────────────────────────
  {
    blockName: "companies",
    eventType: "created",
    displayKey: "events.companies.created.label",
    descriptionKey: "events.companies.created.description",
    payload: [
      { name: "companyId", type: "uuid", description: "Company ID" },
      { name: "name", type: "string", description: "Company name" },
      { name: "domain", type: "string", description: "Domain, may be null" },
      { name: "industry", type: "string", description: "Industry, may be null" },
    ],
    examplePayload: {
      companyId: "uuid",
      name: "Acme Inc",
      domain: "acme.com",
      industry: "SaaS",
    },
    wired: true,
  },
  {
    blockName: "companies",
    eventType: "updated",
    displayKey: "events.companies.updated.label",
    descriptionKey: "events.companies.updated.description",
    payload: [
      { name: "companyId", type: "uuid", description: "Company ID" },
      { name: "name", type: "string", description: "Current name" },
    ],
    examplePayload: { companyId: "uuid", name: "Acme Inc" },
    wired: true,
  },
  {
    blockName: "companies",
    eventType: "deleted",
    displayKey: "events.companies.deleted.label",
    descriptionKey: "events.companies.deleted.description",
    payload: [{ name: "companyId", type: "uuid", description: "Deleted company ID" }],
    examplePayload: { companyId: "uuid" },
    wired: true,
  },

  // ── campaigns ────────────────────────────────────────────────────
  {
    blockName: "campaigns",
    eventType: "created",
    displayKey: "events.campaigns.created.label",
    descriptionKey: "events.campaigns.created.description",
    payload: [
      { name: "campaignId", type: "uuid", description: "Campaign ID" },
      { name: "name", type: "string", description: "Campaign name" },
      { name: "status", type: "string", description: "Initial status" },
    ],
    examplePayload: { campaignId: "uuid", name: "Black Friday 2026", status: "DRAFT" },
    wired: true,
  },
  {
    blockName: "campaigns",
    eventType: "activated",
    displayKey: "events.campaigns.activated.label",
    descriptionKey: "events.campaigns.activated.description",
    payload: [
      { name: "campaignId", type: "uuid", description: "Campaign ID" },
      { name: "name", type: "string", description: "Campaign name" },
    ],
    examplePayload: { campaignId: "uuid", name: "Black Friday 2026" },
    wired: true,
  },
  {
    blockName: "campaigns",
    eventType: "paused",
    displayKey: "events.campaigns.paused.label",
    descriptionKey: "events.campaigns.paused.description",
    payload: [
      { name: "campaignId", type: "uuid", description: "Campaign ID" },
      { name: "name", type: "string", description: "Campaign name" },
    ],
    examplePayload: { campaignId: "uuid", name: "Black Friday 2026" },
    wired: true,
  },
  {
    blockName: "campaigns",
    eventType: "completed",
    displayKey: "events.campaigns.completed.label",
    descriptionKey: "events.campaigns.completed.description",
    payload: [
      { name: "campaignId", type: "uuid", description: "Campaign ID" },
      { name: "name", type: "string", description: "Campaign name" },
    ],
    examplePayload: { campaignId: "uuid", name: "Black Friday 2026" },
    wired: true,
  },

  // ── experiences ──────────────────────────────────────────────────
  {
    blockName: "experiences",
    eventType: "created",
    displayKey: "events.experiences.created.label",
    descriptionKey: "events.experiences.created.description",
    payload: [
      { name: "experienceId", type: "uuid", description: "Experience ID" },
      { name: "name", type: "string", description: "Experience name" },
      { name: "status", type: "string", description: "Initial status" },
    ],
    examplePayload: { experienceId: "uuid", name: "Yoga Retreat", status: "DRAFT" },
    wired: true,
  },
  ...[
    ["open", "OPEN"],
    ["sold_out", "SOLD_OUT"],
    ["completed", "COMPLETED"],
    ["cancelled", "CANCELLED"],
  ].map(
    ([slug, value]) =>
      ({
        blockName: "experiences",
        eventType: `status_changed_to_${slug}`,
        displayKey:
          `events.experiences.status_changed_to_${slug}.label` as MessageKey,
        descriptionKey:
          `events.experiences.status_changed_to_${slug}.description` as MessageKey,
        payload: [
          { name: "experienceId", type: "uuid", description: "Experience ID" },
          { name: "name", type: "string", description: "Experience name" },
          { name: "previousStatus", type: "string", description: "Status before transition" },
          { name: "status", type: "string", description: `Always "${value}"` },
        ],
        examplePayload: {
          experienceId: "uuid",
          name: "Yoga Retreat",
          previousStatus: "OPEN",
          status: value,
        },
        wired: true,
      }) as BlockEvent
  ),

  // ── routines (meta) ──────────────────────────────────────────────
  {
    blockName: "routines",
    eventType: "run_failed",
    displayKey: "events.routines.run_failed.label",
    descriptionKey: "events.routines.run_failed.description",
    payload: [
      { name: "routineId", type: "uuid", description: "ID of the routine that failed" },
      { name: "name", type: "string", description: "Routine name" },
      { name: "runId", type: "uuid", description: "ID of the failing run" },
      { name: "error", type: "string", description: "Error message" },
    ],
    examplePayload: {
      routineId: "uuid",
      name: "Daily summary",
      runId: "uuid",
      error: "Anthropic API timeout",
    },
    wired: true,
  },
];

/** All distinct block names that emit events. */
export function eventBlocks(): string[] {
  return [...new Set(BLOCK_EVENTS.map((e) => e.blockName))];
}

/** Events for a given block, sorted by eventType. */
export function eventsForBlock(blockName: string): BlockEvent[] {
  return BLOCK_EVENTS.filter((e) => e.blockName === blockName).sort((a, b) =>
    a.eventType.localeCompare(b.eventType)
  );
}

/** Lookup a single event by (block, type). */
export function findEvent(blockName: string, eventType: string): BlockEvent | null {
  return (
    BLOCK_EVENTS.find(
      (e) => e.blockName === blockName && e.eventType === eventType
    ) ?? null
  );
}

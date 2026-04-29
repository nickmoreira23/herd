---
name: deals
description: Sub-agent for the Oportunidades (Deals) block in HERD OS
version: "1.0.0"
domain: sales
capabilities: [read, create, update, delete]
models: [Deal]
types: [deal]
---

# Oportunidades (Deals) Sub-Agent

You are the **Oportunidades** specialist for HERD OS. Deals are sales-pipeline opportunities — leads, proposals, negotiations, and closed wins/losses.

## Domain Knowledge

`Deal` is the third leg of the CRM trio: **Contacts** (people) ↔ **Companies** (organizations) ↔ **Deals** (revenue opportunities). Both `contactId` and `companyId` are optional and use `onDelete: SetNull` — deleting a contact or company never destroys a deal, it just nulls the link.

### Stage pipeline

```
LEAD → QUALIFIED → PROPOSAL → NEGOTIATION → WON
                                          → LOST
```

`stage` drives the pipeline. There's no enforced state machine — any stage can transition to any other (admins may need to walk a deal back). However, the API has a single side effect:

> **When PATCH sets stage to WON or LOST and `closedAt` is not provided and not already set, `closedAt` is auto-stamped to `new Date()`.**

This keeps reporting consistent ("when did we close this?") without asking the user to remember to fill the date. If they want to override, they can pass `closedAt` explicitly in the same PATCH.

`lostReason` is a free-text field. The detail UI only shows it when `stage === "LOST"`.

### Money

`amount` is `Decimal(12, 2)` — serialized as a string when crossing the network/component boundary (don't trust JS number precision for money). Default `currency` is `"BRL"`. Store amounts in the deal's transactional currency; conversion to a reporting currency is out of scope for v1.

`probability` is an integer 0–100 (percent). The detail UI computes a "weighted value" (`amount * probability / 100`) for open deals. There's no auto-set of probability based on stage in v1 — admins set it manually.

### Linkage semantics

A deal can have:
- A contact only (individual lead, no associated company yet)
- A company only (B2B opportunity, no specific person identified)
- Both (the typical CRM case — person at company)
- Neither (rare, but allowed — e.g. an unsourced opportunity placeholder)

The list page filters by `contactId` and `companyId` independently. Reverse lookups: from a Company or Contact detail page you can fetch their deals via `GET /api/deals?companyId=...` or `?contactId=...`.

## Owned Files

- **API:** `src/app/api/deals/route.ts`, `src/app/api/deals/[id]/route.ts`
- **Validators:** `src/lib/validators/deals.ts` (`createDealSchema`, `updateDealSchema`, `DEAL_STAGES`)
- **Block manifest:** `src/lib/blocks/blocks/deals.block.ts`
- **Provider:** `src/lib/chat/providers/deal.provider.ts` (search by title, description, source, contact name, company name, tags; `domain = "sales"`, `types = ["deal"]`)
- **Pages:** `src/app/admin/blocks/deals/page.tsx`, `src/app/admin/blocks/deals/[id]/page.tsx`, `src/app/admin/blocks/deals/loading.tsx`
- **Components:** `src/components/deals/` — `types.ts` (`STAGE_CONFIG`, `formatAmount`), `deal-card.tsx`, `deal-row.tsx`, `deals-client.tsx` (header + filter + list/grid toggle), `deal-detail-client.tsx`, `create-deal-dialog.tsx`
- **Pickers reused:** `CompanyPicker` from `src/components/companies/company-picker.tsx`, `ContactPicker` from `src/components/contacts/contact-picker.tsx`

## API contracts

`GET /api/deals` — filters `stage`, `contactId`, `companyId`, `ownerId`, `tag`, `search`, `limit`, `offset`. Envelope `{ deals, total }`. Each deal includes `contact { id, firstName, lastName }` and `company { id, name }`.

`GET /api/deals/[id]` — same includes plus `contact.email`.

`POST /api/deals` — `title` required. Defaults: `stage = LEAD`, `currency = "BRL"`.

`PATCH /api/deals/[id]` — partial update. Auto-stamps `closedAt` on WON/LOST transition (see above).

`DELETE /api/deals/[id]` — hard delete. Linked contact/company are not affected.

## Conventions

- All UI strings are pt-BR ("Oportunidade", "Estágio", "Ganho", "Perdido", etc.)
- Stage badge colors live in `STAGE_CONFIG` in `types.ts` — keep them consistent across list, card, row, and detail.
- Amount formatting: `formatAmount(amount, currency)` — uses `pt-BR` locale and 2 decimals.
- Date inputs in the detail use `<input type="date">` with ISO `YYYY-MM-DD`. The API accepts ISO strings or full datetimes (Zod `coerce.date()`).

---
name: contacts
description: Sub-agent for the Contatos (Contacts) block in HERD OS
version: "1.0.0"
domain: operations
capabilities: [read, create, update, delete]
models: [Contact]
types: [contact]
---

# Contatos (Contacts) Sub-Agent

You are the **Contatos** specialist for HERD OS. The contacts block is the company's CRM book — leads, prospects, customers, and any individual the company interacts with for sales/relationship purposes.

## Domain Knowledge

`Contact` is **distinct from `NetworkProfile`** — they are not interchangeable:

- **NetworkProfile** ([prisma/schema.prisma:1914](../../../prisma/schema.prisma)) is for the partner program: people who participate in compensation, ranks, points, hierarchies. Heavy schema with related tables for ranks, performance, teams, departments.
- **Contact** is lightweight CRM. People you sell to or talk to. No ranks/compensation. Lifecycle is expressed via **tags** (e.g. `lead`, `prospect`, `customer`), not a status enum — formal pipeline lives in the future `deals` block.

`firstName` is the only required field. `lastName` is optional (some leads only have a first name). `email` is **indexed but not unique** — duplicates are allowed and may be deduped by a future UI tool.

`companyId` and `ownerId` are nullable UUID columns **without `@relation`** in v1. They become real foreign keys when:
- `companyId` → `companies` block lands (next block in Wave 2)
- `ownerId` → user/profile model is decided (likely `NetworkProfile` or a new `User`)

`contentJson` is a TipTap document; `contentText` is the plain-text projection used for search and AI retrieval.

## Owned Files

### Components (`src/components/contacts/`)
- `types.ts` — `ContactRow`, `displayName`, `initials`, `formatAddress`, `TAG_SUGGESTIONS`
- `contact-card.tsx` — grid card with avatar/initials
- `contact-row.tsx` — table row
- `contacts-client.tsx` — list page with search + tag filter + list/grid toggle
- `contact-detail-client.tsx` — detail page, sections: Identidade, Profissional, Origem & Owner, Endereço, Social, Tags, Notas. Reuses [`<NoteEditor>`](../../../src/components/notes/note-editor.tsx).
- `create-contact-dialog.tsx` — quick-create dialog

### Pages
- `src/app/admin/blocks/contacts/page.tsx` — list (default grid)
- `src/app/admin/blocks/contacts/loading.tsx` — skeleton
- `src/app/admin/blocks/contacts/[id]/page.tsx` — detail

### API Routes
- `src/app/api/contacts/route.ts` — GET (filters: companyId, ownerId, source, tag, search) + POST
- `src/app/api/contacts/[id]/route.ts` — GET + PATCH + DELETE

### Library
- `src/lib/validators/contacts.ts` — Zod schemas
- `src/lib/chat/providers/contact.provider.ts` — DataProvider (domain: operations)

### Block Manifest
- `src/lib/blocks/blocks/contacts.block.ts`

## Database Model

```prisma
model Contact {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  firstName     String
  lastName      String?
  email         String?
  phone         String?
  avatarUrl     String?
  jobTitle      String?
  department    String?
  companyId     String?   @db.Uuid    // future FK → Company
  ownerId       String?   @db.Uuid    // future FK → User/NetworkProfile
  source        String?
  street        String?
  street2       String?
  city          String?
  state         String?
  zip           String?
  country       String?
  birthday      DateTime?
  linkedinUrl   String?
  twitterHandle String?
  contentJson   Json      @default("{}")
  contentText   String    @default("")
  tags          String[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([email])
  @@index([companyId])
  @@index([ownerId])
  @@map("contacts")
}
```

## API Contract

### `GET /api/contacts`
- Query params: `companyId`, `ownerId`, `source`, `tag`, `search` (LIKE on firstName/lastName/email/phone/jobTitle/department/contentText), `limit` (default 200), `offset`
- Returns: `{ contacts: Contact[], total: number }`, ordered by `updatedAt desc`

### `POST /api/contacts`
- Body: `{ firstName (required), lastName?, email?, phone?, avatarUrl?, jobTitle?, department?, companyId?, ownerId?, source?, street?..country?, birthday?, linkedinUrl?, twitterHandle?, contentJson?, contentText?, tags? }`
- `birthday` is an ISO date string; server converts to Date.
- Returns: created Contact (201)

### `GET /api/contacts/[id]`
- Returns: single Contact

### `PATCH /api/contacts/[id]`
- Body: any subset of POST fields
- Returns: updated Contact

### `DELETE /api/contacts/[id]`
- Returns: `{ deleted: true }`

## Actions (Orchestrator Integration)

Exposed via [src/lib/blocks/blocks/contacts.block.ts](../../../src/lib/blocks/blocks/contacts.block.ts):

- `list_contacts`, `get_contact`, `create_contact`, `update_contact`, `delete_contact`

## Cross-Block Dependencies

- **Depends on:** none (`companyId`/`ownerId` are loose UUID refs, no DB constraint v1).
- **Will be depended on by:** `companies` (back-reference once shipped), `deals` (Deal.contactId), `tickets` (Ticket.contactId), `email-marketing` (mailing lists).
- **Reuses:** [`<NoteEditor>`](../../../src/components/notes/note-editor.tsx).

## Conventions

- API responses use `apiSuccess(data)` / `apiError(message, status)` from `src/lib/api-utils.ts`
- All mutations use `parseAndValidate(request, schema)`
- `email` is **not** unique — dedupe is a UI concern, not a schema constraint
- `contentText` is the canonical search surface; orchestrator never parses `contentJson`
- Lifecycle uses tags, not a status enum (deals carry the formal pipeline)
- `displayName(c)` helper joins firstName + lastName (or just firstName); use it everywhere instead of inline concatenation

---
name: companies
description: Sub-agent for the Empresas (Companies) block in ComeçaAI
version: "1.0.0"
domain: operations
capabilities: [read, create, update, delete]
models: [Company]
types: [company]
---

# Empresas (Companies) Sub-Agent

You are the **Empresas** specialist for ComeçaAI. Companies are B2B organizations the company interacts with — clients, prospects, vendors, partners.

## Domain Knowledge

`Company` is **distinct from**:

- **PartnerBrand** — affiliate-program brands (with PartnerBenefitType, PartnerCommissionType, PartnerStatus). Lives in the partners block.
- **NetworkProfile** — individuals in the partner program (with compensation/ranks).

Company is plain CRM: a record of an organization. Its key relationship is **one-to-many with Contacts** (`Contact.companyId → Company.id`), with `onDelete: SetNull` — deleting a company doesn't destroy contacts, just clears their `companyId`.

The `domain` field (e.g. `"empresa.com"`) is intentional: a future job can match contacts whose email is `*@empresa.com` to auto-assign `companyId`. Not implemented in v1, but the field exists for it.

Address is **inline** on Company (street/city/state/etc), not a FK to the `Location` block. This was a deliberate decision — company addresses are typically billing/HQ context that doesn't need the formality of a Location record. If a company has multiple physical locations (stores, offices), those go in the Locations block and remain unrelated for now.

`size` is an enum (`SMALL | MEDIUM | LARGE | ENTERPRISE`); `industry` is a free-string (no enum to allow flexibility).

## Owned Files

### Components (`src/components/companies/`)
- `types.ts` — `CompanyRow`, `CompanyDetail`, `LinkedContact`, `SIZE_CONFIG`, `formatAddress`, `companyInitials`
- `company-card.tsx` — grid card with logo/initials, industry+size, contact count
- `company-row.tsx` — table row
- `companies-client.tsx` — list page with search + size filter + list/grid toggle
- `company-detail-client.tsx` — full edit page; sections (Identificação, Segmentação, Contato, Endereço, Owner, Tags, Notas) + linked contacts list
- `company-picker.tsx` — reusable searchable picker (used in Contact detail)
- `create-company-dialog.tsx` — quick-create

### Pages
- `src/app/admin/blocks/companies/page.tsx` — list
- `src/app/admin/blocks/companies/loading.tsx`
- `src/app/admin/blocks/companies/[id]/page.tsx` — detail (loads `contacts` + `_count.contacts`)

### API Routes
- `src/app/api/companies/route.ts` — GET (filters: industry, size, ownerId, tag, search; includes `_count.contacts`) + POST
- `src/app/api/companies/[id]/route.ts` — GET (includes up to 50 linked contacts) + PATCH + DELETE

### Library
- `src/lib/validators/companies.ts` — Zod schemas
- `src/lib/chat/providers/company.provider.ts` — DataProvider (domain: operations)

### Block Manifest
- `src/lib/blocks/blocks/companies.block.ts`

## Database Model

```prisma
enum CompanySize { SMALL MEDIUM LARGE ENTERPRISE }

model Company {
  id            String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String
  legalName     String?
  taxId         String?
  website       String?
  domain        String?
  logoUrl       String?
  industry      String?
  size          CompanySize?
  email         String?
  phone         String?
  linkedinUrl   String?
  twitterHandle String?
  street        String?
  street2       String?
  city          String?
  state         String?
  zip           String?
  country       String?
  description   String?
  contentJson   Json         @default("{}")
  contentText   String       @default("")
  ownerId       String?      @db.Uuid
  tags          String[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  contacts      Contact[]

  @@index([domain])
  @@index([industry])
  @@index([ownerId])
  @@map("companies")
}
```

The matching `Contact` change:
```prisma
model Contact {
  // ...
  companyId  String?  @db.Uuid
  company    Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  // ...
}
```

## API Contract

### `GET /api/companies`
- Query params: `industry`, `size`, `ownerId`, `tag`, `search` (LIKE on name/legalName/domain/website/industry/email/contentText), `limit` (default 200), `offset`
- Returns: `{ companies: Company[], total: number }`. Each company includes `_count.contacts`.
- Ordered by `name asc`.

### `POST /api/companies`
- Body: `{ name (required), legalName?, taxId?, website?, domain?, logoUrl?, industry?, size?, email?, phone?, linkedinUrl?, twitterHandle?, street?..country?, description?, contentJson?, contentText?, ownerId?, tags? }`
- Returns: created Company (201)

### `GET /api/companies/[id]`
- Returns: Company with up to 50 linked `contacts` (id, firstName, lastName, email, jobTitle) and `_count.contacts`

### `PATCH /api/companies/[id]`
- Body: any subset of POST fields
- Returns: updated Company (without `contacts` array)

### `DELETE /api/companies/[id]`
- Returns: `{ deleted: true }`. Linked contacts get `companyId = null` automatically (onDelete: SetNull).

## Actions (Orchestrator Integration)

Exposed via [src/lib/blocks/blocks/companies.block.ts](../../../src/lib/blocks/blocks/companies.block.ts):

- `list_companies`, `get_company`, `create_company`, `update_company`, `delete_company`

When the orchestrator deletes a company, it should announce that contacts will be unlinked (companyId set to null), not deleted.

## Cross-Block Dependencies

- **Depended on by:** `contacts` (via `Contact.companyId`).
- **Will be depended on by:** `deals` (Deal.companyId), `email-marketing` (mailing lists at company level), invoices/contracts.
- **Reuses:** [`<NoteEditor>`](../../../src/components/notes/note-editor.tsx).
- **Provides:** [`<CompanyPicker>`](../../../src/components/companies/company-picker.tsx) for downstream blocks that need to attach a Company.

## Conventions

- API responses use `apiSuccess(data)` / `apiError(message, status)` from `src/lib/api-utils.ts`
- All mutations use `parseAndValidate(request, schema)`
- Address is inline; do NOT FK to Location (intentional). If a company has multiple physical sites, treat them as separate Location records.
- `domain` is a unique-ish hint, not enforced — duplicates allowed (a domain can change ownership over time)
- `contentText` is the canonical search surface; orchestrator never parses `contentJson`
- The picker `<CompanyPicker>` gracefully degrades: shows raw UUID if `companyId` references a deleted company, with a clear button to unlink

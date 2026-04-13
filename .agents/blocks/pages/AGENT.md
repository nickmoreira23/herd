---
name: pages
description: Sub-agent for the Pages block — landing page builder for creating and publishing marketing pages
version: "1.0.0"
domain: pages
capabilities: [read, create, update, delete]
models: [LandingPage, LandingPageVersion, LandingPageSection]
types: [landing_page]
---

# Pages Sub-Agent

You are the **Pages** specialist agent for HERD OS, a subscription operations platform built with Next.js, Prisma, and PostgreSQL (Supabase).

## Domain Knowledge

The Pages block is a landing page builder for creating and publishing marketing pages. Users can build pages with a visual editor, manage sections and components, configure SEO metadata, and publish versioned snapshots. Pages go through a status lifecycle (DRAFT, PUBLISHED, ARCHIVED) and support versioning so previous states can be restored.

Key concepts:
- **LandingPage** — the top-level page entity with name, unique slug, SEO fields, status, and page-level styles (JSON).
- **LandingPageVersion** — a versioned snapshot of a page at a point in time, linked via `publishedVersionId`.
- **LandingPageSection** — individual sections within a page, each with layout (JSON) and components (JSON) configuration.
- **Status lifecycle** — pages move through DRAFT -> PUBLISHED (or ARCHIVED). Publishing creates a new version snapshot.
- **SEO** — each page has seoTitle, seoDescription, and seoImage fields for search engine optimization.

## Owned Files

### Components
- `src/components/landing-page/editor/` — Visual page editor components
- `src/components/landing-page/pages-list/` — Page listing and management UI
- `src/components/landing-page/renderer/` — Page rendering/preview components
- `src/components/landing-page/shared/` — Shared utilities and components
- `src/components/landing-page/analytics/` — Page analytics components

### Pages
- `src/app/admin/blocks/pages/page.tsx` — List page
- `src/app/admin/blocks/pages/[pageId]/page.tsx` — Editor page

### API Routes
- `src/app/api/landing-pages/route.ts` — GET (list pages) + POST (create page)
- `src/app/api/landing-pages/[id]/route.ts` — GET + PATCH + DELETE

### Library Code
- `src/lib/validators/landing-page.ts` — Zod schemas (createLandingPageSchema, updateLandingPageSchema)
- `src/lib/chat/providers/landing-page.provider.ts` — DataProvider for chat search/retrieval

### Block Manifest
- `src/lib/blocks/blocks/pages.block.ts` — Runtime action manifest

## Database Models

```prisma
model LandingPage {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name               String
  slug               String   @unique
  description        String?
  status             LandingPageStatus @default(DRAFT) // DRAFT, PUBLISHED, ARCHIVED
  seoTitle           String?
  seoDescription     String?
  seoImage           String?
  pageStyles         Json?
  publishedVersionId String?  @db.Uuid
  lastPublishedAt    DateTime?
  sortOrder          Int      @default(0)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  versions           LandingPageVersion[]
  sections           LandingPageSection[]
}

model LandingPageVersion {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  landingPageId String   @db.Uuid
  snapshot      Json
  createdAt     DateTime @default(now())
  landingPage   LandingPage @relation(...)
}

model LandingPageSection {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  landingPageId String   @db.Uuid
  layout        Json
  components    Json
  sortOrder     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  landingPage   LandingPage @relation(...)
}
```

## API Contract

### `GET /api/landing-pages`
- Returns: Array of landing pages, ordered by sortOrder/createdAt

### `POST /api/landing-pages`
- Body: Validated against `createLandingPageSchema`
- Returns: Created landing page

### `GET /api/landing-pages/[id]`
- Returns: Single landing page with versions and sections

### `PATCH /api/landing-pages/[id]`
- Body: Validated against `updateLandingPageSchema`
- Returns: Updated landing page

### `DELETE /api/landing-pages/[id]`
- Returns: Confirmation of deletion

## Actions (Orchestrator Integration)

### `list_pages` — List landing pages with filters
### `get_page` — Get single landing page by ID with versions and sections
### `create_page` — Required: name, slug
### `update_page` — Required: id. All other fields optional.
### `delete_page` — Required: id. Destructive — confirm first.

## Cross-Block Dependencies

- **Depends on:** None
- **Depended on by:** Chat (page search via DataProvider)

## Conventions

- All API responses use `apiSuccess(data)` / `apiError(message, status)` from `src/lib/api-utils.ts`
- All mutations use `parseAndValidate(request, schema)`
- Slug must be unique — the API returns 409 on duplicate
- Publishing a page creates a new LandingPageVersion with a JSON snapshot
- Page styles and section layout/components are stored as JSON fields

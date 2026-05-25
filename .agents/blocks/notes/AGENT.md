---
name: notes
description: Sub-agent for the Anotações (Notes) block in ComeçaAI
version: "1.0.0"
domain: knowledge
capabilities: [read, create, update, delete]
models: [Note]
types: [note]
---

# Anotações (Notes) Sub-Agent

You are the **Anotações** specialist for ComeçaAI. The notes block is the freeform text-capture surface — anything that doesn't fit a structured entity but should be searchable and recallable later.

## Domain Knowledge

A `Note` is rich-text content (TipTap JSON document) plus metadata (tags, pin, archive). Notes can be:

1. **Standalone** — `entityType` and `entityId` are both `null`. General thoughts, briefings, internal docs.
2. **Linked to an entity** — `entityType` and `entityId` together point to another row (e.g. `entityType="contact"`, `entityId="<contact uuid>"`). Used for "notes about X". The link is a soft polymorphic reference: no FK, no cascade — if the linked entity is deleted, the note remains orphaned and the application/UI must handle the dangling reference.

The constraint that `(entityType, entityId)` must both be non-null or both null is enforced in the Zod validators ([src/lib/validators/notes.ts](../../../src/lib/validators/notes.ts)), not at the DB level.

`contentJson` holds the structured TipTap document used by the editor; `contentText` holds the plain-text projection extracted on save. **Always keep `contentText` in sync with `contentJson`** — search, AI retrieval, and card previews read `contentText`, never `contentJson`.

## Owned Files

### Components (`src/components/notes/`)
- `types.ts` — `NoteRow` interface
- `note-editor.tsx` — TipTap wrapper with toolbar (bold, italic, h1/h2, lists, codeBlock)
- `note-card.tsx` — list grid card
- `notes-client.tsx` — list page with search + filter (active/pinned/archived)
- `note-detail-client.tsx` — detail page with autosave on blur (300ms debounce)
- `create-note-dialog.tsx` — creation modal with optional entity link

### Pages
- `src/app/admin/blocks/notes/page.tsx` — list
- `src/app/admin/blocks/notes/loading.tsx` — skeleton
- `src/app/admin/blocks/notes/[id]/page.tsx` — detail

### API Routes
- `src/app/api/notes/route.ts` — GET (filters: tag, pinned, archived, entityType, entityId, search) + POST
- `src/app/api/notes/[id]/route.ts` — GET + PATCH + DELETE

### Library
- `src/lib/validators/notes.ts` — Zod schemas
- `src/lib/chat/providers/note.provider.ts` — DataProvider (domain: knowledge)

### Block Manifest
- `src/lib/blocks/blocks/notes.block.ts`

## Database Model

```prisma
model Note {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title       String
  contentJson Json     @default("{}")
  contentText String   @default("")
  tags        String[]
  pinned      Boolean  @default(false)
  archived    Boolean  @default(false)
  entityType  String?
  entityId    String?  @db.Uuid
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([pinned, updatedAt])
  @@index([archived])
  @@index([entityType, entityId])
  @@map("notes")
}
```

## API Contract

### `GET /api/notes`
- Query params: `tag`, `pinned` (`true|false`), `archived` (`true|false|all`, default excludes archived), `entityType`, `entityId`, `search` (LIKE on title/contentText), `limit` (default 50), `offset`
- Returns: `{ notes: Note[], total: number }`, ordered by `pinned desc, updatedAt desc`

### `POST /api/notes`
- Body: `{ title (required), contentJson?, contentText?, tags?, pinned?, entityType?, entityId? }`
- Validation: `entityType` and `entityId` must be both present or both absent
- Returns: created Note (201)

### `GET /api/notes/[id]`
- Returns: single Note with full `contentJson`

### `PATCH /api/notes/[id]`
- Body: any subset of create fields plus `archived`
- Returns: updated Note

### `DELETE /api/notes/[id]`
- Returns: `{ deleted: true }`

## Actions (Orchestrator Integration)

Exposed via [src/lib/blocks/blocks/notes.block.ts](../../../src/lib/blocks/blocks/notes.block.ts):

- `list_notes` — GET /api/notes
- `get_note` — GET /api/notes/{id}
- `create_note` — POST (required: title)
- `update_note` — PATCH (required: id)
- `delete_note` — DELETE (required: id)

When the orchestrator creates a note linked to an entity, it MUST send both `entityType` and `entityId`. When updating `contentJson`, it should also update `contentText` so search stays consistent — preferably by extracting plain text from the new JSON document.

## Cross-Block Dependencies

- **Depends on:** none directly. Soft polymorphic refs to any block via `entityType`/`entityId` (no FK).
- **Depended on by:** none yet. Future: blocks could query notes filtered by their own `entityType` to show "notes about this contact/deal/task".

## Conventions

- All API responses use `apiSuccess(data)` / `apiError(message, status)` from `src/lib/api-utils.ts`
- All mutations use `parseAndValidate(request, schema)` for body parsing + Zod validation
- `contentText` is the canonical search surface; the orchestrator and chat retrieval **never** parse `contentJson`
- TipTap deps: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`. The editor is client-only — `note-editor.tsx` uses `"use client"` and `immediatelyRender: false` to avoid SSR mismatches
- Catalog excludes archived notes; orchestrator can opt in via `archived: "true"` filter

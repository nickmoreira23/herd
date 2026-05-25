---
name: feedbacks
description: Sub-agent for the Feedbacks block in ComeçaAI
version: "1.0.0"
domain: knowledge
capabilities: [read, create, update, delete, upvote]
models: [Feedback]
types: [feedback]
---

# Feedbacks Sub-Agent

You are the **Feedbacks** specialist for ComeçaAI. The feedbacks block centralizes everything users say about the product — suggestions, bugs, complaints, praise, questions, ideas. Today the focus is internal feedback (received via the app); future iterations will ingest from external channels (Twitter, e-mail, public forms) via the `source` field.

## Domain Knowledge

A `Feedback` has three classifying enums:

- **`type`** — `SUGGESTION | BUG | COMPLAINT | PRAISE | QUESTION | IDEA` — what kind of feedback it is.
- **`status`** — `NEW → TRIAGED → PLANNED → IN_PROGRESS → DONE | DECLINED` — the lifecycle.
- **`priority`** — `LOW | MEDIUM | HIGH | URGENT` — triage urgency.

Three behaviors to remember:

1. **`resolvedAt` is automatic.** When PATCH transitions `status` to `DONE` or `DECLINED` and `resolvedAt` is null, the route handler sets it to `now()`. Reverting status to a non-resolved state clears it. Never set `resolvedAt` manually from the client.
2. **`voteCount` only increments via `POST /api/feedbacks/{id}/upvote`.** PATCH does not accept `voteCount`. There is **no deduplication** in v1 — the same browser can spam votes. Document this as known tech debt; future fix likely uses session/user id.
3. **Polymorphic outbound link** via `entityType` + `entityId` (same pattern as notes). Both must be set together or both null. Soft reference — no FK, no cascade. Useful for "feedback about Product X", "feedback about Feature Y".

`contentJson` holds a TipTap document; `contentText` holds the plain-text projection used for search. Keep them in sync on every PATCH that touches content.

## Owned Files

### Components (`src/components/feedbacks/`)
- `types.ts` — `FeedbackRow`, three `*_CONFIG` maps with labels/colors/emojis, `KANBAN_COLUMNS`
- `feedback-card.tsx` — kanban card with upvote button, badges, priority dot
- `feedbacks-kanban.tsx` — 6-column kanban board (no drag-drop v1; status changes happen in the detail page)
- `feedbacks-client.tsx` — list page wrapper with search + type/priority filters + create dialog
- `feedback-detail-client.tsx` — full edit page with TipTap editor (reuses [`<NoteEditor>`](../../../src/components/notes/note-editor.tsx)), inline status/type/priority selects with autosave, submitter inputs, tags, upvote button
- `create-feedback-dialog.tsx` — quick-create dialog (title + type + optional submitter/source)

### Pages
- `src/app/admin/blocks/feedbacks/page.tsx` — kanban
- `src/app/admin/blocks/feedbacks/loading.tsx` — skeleton
- `src/app/admin/blocks/feedbacks/[id]/page.tsx` — detail

### API Routes
- `src/app/api/feedbacks/route.ts` — GET (filters: type, status, priority, source, entityType, entityId, search) + POST
- `src/app/api/feedbacks/[id]/route.ts` — GET + PATCH (with auto-resolvedAt) + DELETE
- `src/app/api/feedbacks/[id]/upvote/route.ts` — POST (atomic increment)

### Library
- `src/lib/validators/feedbacks.ts` — Zod schemas + enum constants
- `src/lib/chat/providers/feedback.provider.ts` — DataProvider (domain: knowledge)

### Block Manifest
- `src/lib/blocks/blocks/feedbacks.block.ts`

## Database Model

```prisma
enum FeedbackType { SUGGESTION BUG COMPLAINT PRAISE QUESTION IDEA }
enum FeedbackStatus { NEW TRIAGED PLANNED IN_PROGRESS DONE DECLINED }
enum FeedbackPriority { LOW MEDIUM HIGH URGENT }

model Feedback {
  id             String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title          String
  contentJson    Json             @default("{}")
  contentText    String           @default("")
  type           FeedbackType     @default(SUGGESTION)
  status         FeedbackStatus   @default(NEW)
  priority       FeedbackPriority @default(MEDIUM)
  source         String?
  submitterName  String?
  submitterEmail String?
  tags           String[]
  voteCount      Int              @default(0)
  entityType     String?
  entityId       String?          @db.Uuid
  resolvedAt     DateTime?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([status, updatedAt])
  @@index([type])
  @@index([priority])
  @@index([entityType, entityId])
  @@map("feedbacks")
}
```

## API Contract

### `GET /api/feedbacks`
- Query params: `type`, `status`, `priority`, `source`, `entityType`, `entityId`, `search`, `limit` (default 200), `offset`
- Returns: `{ feedbacks: Feedback[], total: number }`, ordered by `voteCount desc, updatedAt desc`

### `POST /api/feedbacks`
- Body: `{ title (required), contentJson?, contentText?, type?, status?, priority?, source?, submitterName?, submitterEmail?, tags?, entityType?, entityId? }`
- Side effect: if `status` is DONE/DECLINED at create time, `resolvedAt` is set to now
- Returns: created Feedback (201)

### `GET /api/feedbacks/[id]`
- Returns: single Feedback

### `PATCH /api/feedbacks/[id]`
- Body: any subset of POST fields (no `voteCount` — use the upvote endpoint)
- Side effect: status transition to DONE/DECLINED auto-sets `resolvedAt`; transition out of those clears it
- Returns: updated Feedback

### `DELETE /api/feedbacks/[id]`
- Returns: `{ deleted: true }`

### `POST /api/feedbacks/[id]/upvote`
- Body: none
- Returns: `{ id, voteCount }` (atomic increment via `voteCount: { increment: 1 }`)
- **No deduplication.** Anyone can call multiple times.

## Actions (Orchestrator Integration)

Exposed via [src/lib/blocks/blocks/feedbacks.block.ts](../../../src/lib/blocks/blocks/feedbacks.block.ts):

- `list_feedbacks` — GET /api/feedbacks
- `get_feedback` — GET /api/feedbacks/{id}
- `create_feedback` — POST (required: title)
- `update_feedback` — PATCH (required: id)
- `delete_feedback` — DELETE (required: id)
- `upvote_feedback` — POST /upvote (required: id)

When the orchestrator changes status to/from DONE/DECLINED, it should mention that `resolvedAt` was updated server-side.

## Cross-Block Dependencies

- **Depends on:** none.
- **Depended on by:** none yet. Future blocks (Products, Contacts) may filter feedbacks by `entityType`/`entityId` to surface "feedback about this product/customer".
- **Reuses:** [`<NoteEditor>`](../../../src/components/notes/note-editor.tsx) (TipTap wrapper from notes block — domain-neutral).

## Conventions

- API responses use `apiSuccess(data)` / `apiError(message, status)` from `src/lib/api-utils.ts`
- All mutations use `parseAndValidate(request, schema)` for body parsing + Zod validation
- `contentText` is the canonical search surface; orchestrator never parses `contentJson`
- DataProvider catalog excludes feedbacks in DONE/DECLINED status (focus on actionable items)
- `voteCount` and `resolvedAt` are server-managed — never trust client-provided values for these fields (PATCH validators don't accept them)

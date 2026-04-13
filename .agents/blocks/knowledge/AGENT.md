# Knowledge Meta-Feature Agent

> Knowledge is a **meta-feature** — it composes first-class blocks into a unified knowledge base.
> It owns no content types directly. Each block owns its own data, API, and components.

## Role

Knowledge provides:
- **Dashboard** — aggregated view of all composed blocks with item counts
- **Folder organization** — `KnowledgeFolder` model for media blocks (documents, images, videos, audios)
- **Composition settings** — toggle which blocks participate via `knowledge_enabled_blocks` Setting
- **Origin tracking** — items created through knowledge have `sourceFeature: "knowledge"`
- **Sub-panel navigation** — unified sidebar linking to each block's knowledge view

## Composed Blocks

| Block | Type | Prisma Model | Provider |
|-------|------|-------------|----------|
| documents | document | KnowledgeDocument | DocumentProvider |
| images | image | KnowledgeImage | ImageProvider |
| videos | video | KnowledgeVideo | VideoProvider |
| audios | audio | KnowledgeAudio | AudioProvider |
| tables | table | KnowledgeTable | TableProvider |
| forms | form | KnowledgeForm | FormProvider |
| links | link | KnowledgeLink | LinkProvider |
| feeds | rss | KnowledgeRSSFeed/Entry | FeedProvider |
| apps | app_data | KnowledgeApp/DataPoint | AppProvider |

Each block has its own agent at `.agents/blocks/{name}/AGENT.md`.

## Owned Models

- `KnowledgeFolder` — folder organization for media blocks (DOCUMENT, IMAGE, VIDEO, AUDIO types)

## File Paths

| Category | Path |
|----------|------|
| Dashboard component | `src/components/knowledge/knowledge-dashboard.tsx` |
| Settings dialog | `src/components/knowledge/knowledge-settings-dialog.tsx` |
| Admin pages | `src/app/admin/organization/knowledge/` |
| Folder API | `src/app/api/knowledge/folders/` |
| Shared types | `src/lib/knowledge-commons/types.ts` |
| Constants | `src/lib/knowledge-commons/constants.ts` |
| Block manifest | `src/lib/blocks/blocks/knowledge.block.ts` |

## Key Constants

```typescript
KNOWLEDGE_TYPE_BLOCKS = ["documents","images","videos","audios","tables","forms","links","feeds","apps"]
KNOWLEDGE_BLOCKS_SETTING_KEY = "knowledge_enabled_blocks"
DEFAULT_KNOWLEDGE_BLOCKS = all 9 blocks enabled
```

## Settings API

Uses the generic `/api/settings` endpoint:
- **Read**: `GET /api/settings` → key `knowledge_enabled_blocks` → comma-separated block names
- **Write**: `PATCH /api/settings` → `{ "knowledge_enabled_blocks": "documents,images,videos" }`
- **Default**: All 9 blocks enabled when no setting exists

## Admin Pages

Knowledge admin pages live at `/admin/organization/knowledge/`:
- Root page → Dashboard with block grid and counts
- Sub-pages delegate to block components:
  - `/knowledge/documents` → `DocumentTable`
  - `/knowledge/images` → `ImageTable`
  - `/knowledge/videos` → `VideoTable`
  - `/knowledge/audios` → `AudioTable`
  - `/knowledge/tables` → `TableList` / `TableView`
  - `/knowledge/forms` → `FormList` / `FormBuilder`
  - `/knowledge/links` → `LinkTable`
  - `/knowledge/feeds` → `FeedTable`
  - `/knowledge/apps` → `AppTable` / `AppDetailClient`

The same components are also accessible via `/admin/blocks/{name}/`.

## Conventions

- Never add content types directly to knowledge — create a new block instead
- Knowledge dashboard reads `enabledBlocks` from Settings table server-side
- Folder API stays at `/api/knowledge/folders/` (not moved to block paths)
- Block components import from `@/components/{block-name}/` (not `@/components/knowledge/`)
- Origin tracking: pass `sourceFeature: "knowledge"` in create payloads from knowledge pages

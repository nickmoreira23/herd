# Knowledge Route Layer Audit

Generated: Phase 1.5, Etapa 1.5.6e (ε.1).

## Purpose

Document the architectural state of the Knowledge meta-feature route
layer after the 1.5.6c cleanup, 1.5.6d block migrations, and twin
consolidations through α/β/γ/δ/ε. Captures decisions for future
reference.

## Dual List Pattern — Categoria 2 sistemática (8 pares)

Pattern observed: `{block}-table.tsx` (Knowledge route, DataTable
inline) coexists with `{block}s-list-client.tsx` (Blocks route,
BlockListPage shell). Logic shared, chrome wrappers differ. For media
blocks (audios, documents, images, videos), Knowledge side has folder
nav inline that Blocks side does not need.

### Consolidation deferred

Architectural decision (1.5.6e):

1. 1.5.6e closes Knowledge ecosystem within Phase 1.5; not a refactor
   etapa for new abstraction.
2. Surface (top-level feature post-Phase 1.5) may redefine block
   exposure across routes, potentially making this pattern obsolete.
3. 1.5.6f covers blocks outside Knowledge route layer; would not
   inherit a useBlockListing hook.
4. Maintenance cost manageable (chrome only; not business logic).

### Pairs covered

Line counts include the new architectural-comment header (~18 lines)
added by ε.1 to every file in the table.

| # | Knowledge side | Blocks side | Folder nav |
|---|---|---|---|
| 1 | forms/form-list.tsx (297L) | forms/forms-list-client.tsx (166L) | no |
| 2 | tables/table-list.tsx (289L) | tables/tables-list-client.tsx (183L) | no |
| 3 | feeds/feed-table.tsx (295L) | feeds/feeds-list-client.tsx (236L) | no |
| 4 | links/link-table.tsx (302L) | links/links-list-client.tsx (241L) | no |
| 5 | audios/audio-table.tsx (489L) | audios/audios-list-client.tsx (315L) | yes |
| 6 | documents/document-table.tsx (489L) | documents/documents-list-client.tsx (324L) | yes (+ /operation consumer) |
| 7 | images/image-table.tsx (478L) | images/images-list-client.tsx (315L) | yes |
| 8 | videos/video-table.tsx (479L) | videos/videos-list-client.tsx (315L) | yes |

Total live in dual list pattern: 5,213 lines across 16 files.

### Revisit triggers

Reconsider extraction when any of:
- Surface feature shipped and shows clear contract for cross-route block exposure.
- 3rd consumer of the same listing logic appears (beyond the dual route).
- Maintenance cost realized as bug from forgetting to update both sides.

## Twins eliminated through Phase 1.5.6d/e (chronology)

| Etapa | Pair | Notes |
|---|---|---|
| 1.5.6d-α | forms: form-settings, create-form-modal, form-delete-dialog, forms-empty | Cat 1 accidental forks |
| 1.5.6d-β | tables: create-table-modal, table-delete-dialog, field-delete-dialog | partial; some deferred |
| 1.5.6d-γ | apps: app-delete-dialog, apps-empty | Cat 1 accidental forks |
| 1.5.6d-δ | feeds + links twins (4 pairs total) | Cat 1; only API endpoint differed |
| 1.5.6d-ε | media batch (6 pairs across audios/images/videos) | ~720 lines eliminated |
| 1.5.6e ε.1 | knowledge-apps-empty.tsx → apps-empty.tsx | Cat 1, ~40 lines |

## Files inventory in `src/components/knowledge/`

Post-ε.1 (after `knowledge-apps-empty.tsx` consolidation):

| File | Lines | Category | Notes |
|---|---|---|---|
| knowledge-dashboard.tsx | 98 | Knowledge-specific | Top-level meta-feature dashboard. Hardcoded BLOCK_CONFIG with 9 sources (documents/images/videos/audios/tables/forms/links/feeds/apps); not extracted to catalog because manage-knowledge-dialog consumes BLOCK_ICON_MAP/getBlockLabel from registry directly. |
| manage-knowledge-dialog.tsx | 283 | Knowledge-specific | Sources config UI. Pulls block icons + labels from registry (not a hardcoded catalog). |
| tables/knowledge-create-table-modal.tsx | 124 | Knowledge-specific | Knowledge-side table creation modal. Distinct from Blocks-side counterpart. |
| tables/airtable-import-modal.tsx | 714 | Knowledge-specific | Airtable import wizard (Knowledge-tables-only flow). |
| tables/knowledge-tables-empty.tsx | 80 | Knowledge-specific | Empty state with Airtable connect button + create modal launcher. Uses inline strings (not yet i18n; will be migrated in ε.2). |

Total live in `src/components/knowledge/`: 1,299 lines across 5 files.

## RSC pages inventory in `src/app/admin/organization/knowledge/`

14 pages. All delegate to client components (block tables, dashboard).
Server-side responsibility: data fetching + Prisma serialization +
empty-state branching. No user-visible strings on pages themselves
beyond what comes from delegated components.

| Path | Notes |
|---|---|
| page.tsx | Knowledge dashboard (delegates to KnowledgeDashboard). |
| apps/page.tsx | Apps list (uses AppTable + AppsEmpty). Updated by ε.1. |
| apps/[id]/page.tsx | App detail. |
| audios/page.tsx | Audios list. |
| documents/page.tsx | Documents list. |
| feeds/page.tsx | Feeds list. |
| forms/page.tsx | Forms list. |
| forms/[id]/page.tsx | Form builder. |
| forms/[id]/responses/page.tsx | Form responses. |
| images/page.tsx | Images list. |
| links/page.tsx | Links list. |
| tables/page.tsx | Tables list. |
| tables/[id]/page.tsx | Table grid. |
| videos/page.tsx | Videos list. |

## API routes audit

`src/app/api/knowledge/**` is the canonical API surface for all blocks
exposed as Knowledge sources. Not duplicated against another path —
the Blocks route surface (BlockListPage shells) consumes the same
endpoints.

| Group | Routes | Category |
|---|---|---|
| apps/* | 14 | Knowledge-specific (sync, callback, terra widget, webhooks) |
| audios/* | 4 | Block API (canonical) |
| documents/* | 4 | Block API (canonical) |
| feeds/* | 8 | Block API (canonical) |
| folders/* | 2 | Knowledge-specific (folder nav for media blocks) |
| forms/* | 18 | Block API (canonical) — fields, sections, responses, templates |
| images/* | 4 | Block API (canonical) |
| links/* | 6 | Block API (canonical) |
| tables/* | 10 | Block API (canonical) — fields, records, upload |
| videos/* | 4 | Block API (canonical) |

Cross-context routes (not under /api/knowledge but related):
- `api/agents/[id]/knowledge/*` — agent ↔ knowledge linking.
- `api/cron/knowledge-apps-sync/*` — scheduled sync worker.
- `api/meetings/[id]/knowledge/*` — meetings ↔ knowledge linking.

All routes classified as legitimate. No ad-hoc forks discovered in API
layer.

## Ad-hoc forks discovered (not in original 9-pair list)

None. The Knowledge route layer post-1.5.6c/d cleanup contains only:
- the 8 dual-list pairs (Cat 2 sistemática, deferred), and
- 5 genuinely Knowledge-specific files (dashboard, sources dialog,
  Knowledge-tables creation/import/empty).

## Architectural patterns observed

1. **Two-surface block exposure**: every block reachable via Knowledge
   route (`/admin/organization/knowledge/{block}`) AND Blocks route
   (BlockListPage shell). Logic shared, chrome wrappers differ. Pattern
   is intentional but creates twin maintenance until Surface lands.

2. **Folder nav asymmetry**: media blocks (audios/documents/images/
   videos) expose folder navigation only on Knowledge side. Folders
   are a Knowledge meta-feature concept, not a block-level concept.

3. **Registry-driven sources dialog**: `manage-knowledge-dialog.tsx`
   reads `BLOCK_ICON_MAP` and `getBlockLabel` from the blocks
   registry; not a Template D catalog. Adding a block to the registry
   automatically makes it eligible as a Knowledge source.

4. **Knowledge-tables specialization**: `tables/` subfolder under
   `components/knowledge/` is the only block-specific Knowledge
   namespace remaining post-1.5.6c. Justified by Airtable import flow
   that is meaningful only in the Knowledge context.

5. **Document table extra consumer**: `document-table.tsx` is also
   imported by `src/app/admin/operation/documents/page.tsx` — a third
   consumer outside the Knowledge/Blocks dual-route pattern. Worth
   tracking if extraction is reconsidered.

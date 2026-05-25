---
name: tasks
description: Sub-agent for the Tarefas (Tasks) block in ComeçaAI
version: "1.0.0"
domain: operations
capabilities: [read, create, update, delete, sync]
models: [Task]
types: [task]
---

# Tarefas (Tasks) Sub-Agent

You are the **Tarefas** specialist agent for ComeçaAI. The tasks block is the unified work-tracking surface across ComeçaAI: every actionable item — local or imported from an external project-management tool — lives here.

## Domain Knowledge

A `Task` is a unit of work with a status, priority, optional due date, and optional assignee. Tasks come from two origins:

1. **Local tasks** — created inside ComeçaAI via the UI or chat orchestrator. `sourceIntegration` is `null`. Fully editable.
2. **Synced tasks** — imported from connected `PROJECT_MANAGEMENT` integrations (Linear, Asana, ClickUp, Trello, etc.). `sourceIntegration` holds the integration slug and `sourceId` holds the external ID. Tasks are unique per `(sourceIntegration, sourceId)` (`@@unique`). Edits are allowed but **may be overwritten** on the next sync — prefer editing in the source tool.

Subtasks are modeled via the self-relation `parentTaskId` → `parent` / `children` (`Task.TaskSubtasks`). Deletes use `onDelete: SetNull`, so deleting a parent does not cascade.

## Owned Files

### Components
- `src/components/tasks/` — kanban view, calendar view, columns, filter bar, source badge, create dialog, detail client, types

### Pages
- `src/app/admin/blocks/tasks/page.tsx` — list page
- `src/app/admin/blocks/tasks/[id]/page.tsx` — detail page
- `src/app/admin/blocks/tasks/loading.tsx` — skeleton

### API Routes
- `src/app/api/tasks/route.ts` — GET (list w/ filters) + POST (create)
- `src/app/api/tasks/[id]/route.ts` — GET + PATCH + DELETE
- `src/app/api/tasks/sync/route.ts` — POST (trigger sync from connected integrations)

### Library Code
- `src/lib/chat/providers/task.provider.ts` — DataProvider for the chat orchestrator

### Block Manifest
- `src/lib/blocks/blocks/tasks.block.ts` — runtime action manifest

## Database Model

```prisma
enum TaskStatus { BACKLOG TODO IN_PROGRESS IN_REVIEW DONE CANCELLED }
enum TaskPriority { NONE LOW MEDIUM HIGH URGENT }

model Task {
  id                String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title             String
  description       String?
  status            TaskStatus   @default(TODO)
  priority          TaskPriority @default(NONE)
  dueDate           DateTime?
  assignee          String?
  assigneeEmail     String?
  projectName       String?
  labels            String[]
  sourceIntegration String?
  sourceId          String?
  sourceUrl         String?
  sourceStatus      String?
  sourcePriority    String?
  parentTaskId      String?      @db.Uuid
  completedAt       DateTime?
  rawData           Json?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  parent   Task?  @relation("TaskSubtasks", fields: [parentTaskId], references: [id], onDelete: SetNull)
  children Task[] @relation("TaskSubtasks")

  @@unique([sourceIntegration, sourceId])
  @@index([status])
  @@index([dueDate])
  @@index([sourceIntegration])
  @@map("tasks")
}
```

## API Contract

### `GET /api/tasks`
- Query params: `status`, `priority`, `source`, `search`, `limit` (default 50), `offset` (default 0)
- Returns: `{ tasks: Task[], total: number }`

### `POST /api/tasks`
- Body: `{ title (required), description?, status?, priority?, dueDate?, assignee?, assigneeEmail?, projectName?, labels? }`
- Validation is currently manual (title presence + trim). `sourceIntegration` is forced to `null` — locally created tasks are never linked to an external source.
- Returns: created Task (201)

### `GET /api/tasks/[id]`
- Returns: single Task

### `PATCH /api/tasks/[id]`
- Body: any subset of `title, description, status, priority, dueDate, assignee, assigneeEmail, labels, completedAt, projectName`
- Returns: updated Task

### `DELETE /api/tasks/[id]`
- Returns: `{ deleted: true }`. Children of this task have their `parentTaskId` set to null (no cascade).

### `POST /api/tasks/sync`
- Body: none
- Returns: `{ synced: string[], errors: string[] }`. Currently a stub — actual per-integration sync (Asana/Linear/etc.) is TODO.

## Actions (Orchestrator Integration)

Exposed via [`src/lib/blocks/blocks/tasks.block.ts`](../../../src/lib/blocks/blocks/tasks.block.ts):

- `list_tasks` — GET /api/tasks
- `get_task` — GET /api/tasks/{id}
- `create_task` — POST /api/tasks (required: title)
- `update_task` — PATCH /api/tasks/{id} (required: id)
- `delete_task` — DELETE /api/tasks/{id} (required: id)
- `sync_tasks` — POST /api/tasks/sync

When updating a task whose `sourceIntegration` is non-null, the orchestrator should warn the user that changes may be overwritten on the next sync.

## Cross-Block Dependencies

- **Depends on:** `integrations` (for the `sync_tasks` action — reads `Integration` rows where `category = "PROJECT_MANAGEMENT"` and `status = "CONNECTED"`)
- **Depended on by:** none yet. Future blocks (deals, contacts, tickets) may reference tasks for follow-ups.

## Conventions

- API responses use `apiSuccess(data)` / `apiError(message, status)` from `src/lib/api-utils.ts`
- The `Task` model uses Postgres-generated UUIDs (`gen_random_uuid()`)
- Validation in routes is currently manual; a future polish pass should introduce Zod schemas in `src/lib/validators/task.ts`
- The DataProvider implements the `DataProvider` interface from [`src/lib/chat/types.ts`](../../../src/lib/chat/types.ts) and lives in the `operations` domain
- Catalog excludes tasks in `DONE` or `CANCELLED` status to keep the orchestrator focused on actionable work

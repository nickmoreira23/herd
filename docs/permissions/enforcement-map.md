# Enforcement Map — `requireOrgRole` call-sites → `(resource, action)`

**Status:** contract — consumed literally by Etapas V2.2–V2.4. Read-only artifact;
no route changed behavior to produce it.
**Source:** Discovery V2 (`docs/discovery/ROLES_PERMISSIONS_V2_DISCOVERY.md`) +
Etapa V2.1 verification against the code at branch `feat/can-enforcement-map`
(base `cd0b3e9`, V1 tip).
**Updated:** 2026-06-01

This document is the exact mapping each `requireOrgRole(...)` call-site must use
when (and if) it adopts `can(actor, { resource, action, scopeType })` enforcement.
Without it, wiring `can()` is guesswork. The fixed enum gate (`requireOrgRole`)
stays as-is until a later etapa flips enforcement behind a flag.

## How to read

- **`allowedRoles`** is the CURRENT `requireOrgRole([...])` argument (coarse,
  by-role-name gate). It is informational — the target `(resource, action)` is
  what a future `can()` check would assert.
- **`scope`** = `org` unless the capability is bound to a single department
  (`department`), in which case `scopeId` is the route's `[id]`/`[deptId]` param.
- **`kind`** = `clean` (mapped 1:1 in discovery) or `resolved` (one of the 6
  ambiguous, resolved per the cravado decisions; rationale in the notes below).

## Map (27 call-sites)

| # | file : method | allowedRoles | resource | action | scope | kind | note |
|---|---|---|---|---|---|---|---|
| 1 | `api/org/hierarchy/route.ts` : GET | O,A,M | org_hierarchy | read | org | clean | |
| 2 | `api/org/hierarchy/reparent/route.ts` : PATCH | O,A | org_hierarchy | update | org | clean | move node in tree |
| 3 | `api/org-chart/internal/route.ts` : GET | O,A,M | org_hierarchy | read | org | clean | org-chart ⇒ hierarchy |
| 4 | `api/org/[id]/departments/route.ts` : POST | O,A | departments | create | org | clean | dept on a child org (vertical) |
| 5 | `api/org/[id]/departments/[deptId]/route.ts` : DELETE | O,A | departments | delete | org | clean | |
| 6 | `api/departments/route.ts` : GET | O,A,M | departments | read | org | clean | |
| 7 | `api/departments/route.ts` : POST | O,A | departments | create | org | clean | |
| 8 | `api/departments/tree/route.ts` : GET | O,A,M | departments | read | org | clean | |
| 9 | `api/departments/[id]/route.ts` : GET | O,A,M | departments | read | org | clean | |
| 10 | `api/departments/[id]/route.ts` : PATCH | O,A | departments | update | org | clean | |
| 11 | `api/departments/[id]/route.ts` : DELETE | O,A | departments | delete | org | clean | deletes the dept itself |
| 12 | `api/locations/route.ts` : GET | O,A,M | locations | read | org | clean | |
| 13 | `api/locations/route.ts` : POST | O,A | locations | create | org | clean | |
| 14 | `api/locations/[id]/route.ts` : GET | O,A,M | locations | read | org | clean | |
| 15 | `api/locations/[id]/route.ts` : PATCH | O,A | locations | update | org | clean | |
| 16 | `api/locations/[id]/route.ts` : DELETE | O,A | locations | delete | org | clean | |
| 17 | `api/org/members/[memberId]/role/route.ts` : PATCH | O,A | members | update | org | clean | V1 Etapa 2 — set member ORG role |
| 18 | `admin/organization/members/page.tsx` : RSC | O,A,M | members | read | org | clean | page guard |
| 19 | `api/org/[id]/route.ts` : DELETE | OWNER | org | delete | org | clean | hard-delete (dissolution step 2) |
| 20 | `api/org/[id]/restore/route.ts` : POST | OWNER | org | update | org | **resolved** | D4 — restore = state mutation (ARCHIVED→ACTIVE); no "restore" action |
| 21 | `api/org/[id]/dissolve/route.ts` : POST | OWNER | org | delete | org | **resolved** | D5 — dissolve = soft-delete (ACTIVE→ARCHIVED), step 1 of deletion |
| 22 | `api/org/invitations/route.ts` : POST | O,A | members | invite | org | **resolved** | D6 — invite is a facet of members; no `invitations` resource |
| 23 | `api/org/invitations/route.ts` : GET | O,A | members | read | org | **resolved** | D6 (corrected) — route is **GET** (list), not DELETE; reading invites ⇒ members:read |
| 24 | `api/org/invitations/[token]/revoke/route.ts` : POST | O,A | members | invite | org | **resolved** | D7 — revoke = same capability as managing invites; no "revoke" action |
| 25 | `api/departments/[id]/members/route.ts` : POST | O,A | departments | update | department | **resolved** | D8 (corrected) — add member to dept = update the dept; scopeId = `[id]` (deptId) |
| 26 | `api/departments/[id]/members/route.ts` : DELETE | O,A | departments | update | department | **resolved** | D8 + chat — remove member = modify dept roster = update (NOT delete the dept); scopeId = `[id]` |
| 27 | `admin/organization/permissions/page.tsx` : RSC | O,A,M | members | read | org | **resolved (proxy)** | D9 — viewing the role model is part of reading members governance; no dedicated `permissions` resource. See Proxies. |

**Totals:** 27 call-sites — 21 clean, 6 resolved (rows 20, 21? …). The 6 ambiguous
resolved per discovery are: **20 (restore), 23 (GET invitations), 24 (revoke),
25 (dept member add), 26 (dept member remove), 27 (permissions page)**. Rows 19
(hard-delete) and 21 (dissolve) and 22 (invite POST) were already clean in
discovery and are transcribed, not re-debated.

## Corrections applied in V2.1 (vs the spec's cravado method labels)

The spec's decisions 6 and 8 inherited two wrong HTTP-method labels from the
Etapa 2 blast-radius report. Verified against the real handlers and corrected
(conceptual resolution unchanged):

1. **`org/invitations` is POST + GET — there is no DELETE.** Decision 6 said
   "POST/DELETE"; the route creates (POST) and lists (GET). Mapped: POST →
   `(members, invite)`, GET → `(members, read)`. The phantom DELETE is dropped
   (revocation is the separate `[token]/revoke` route, row 24).
2. **`departments/[id]/members` is POST + DELETE — there is no GET.** Decision 8
   said "GET/POST"; the route adds (POST) and removes (DELETE) a department
   member. Both map to `(departments, update)` scope `department`. The phantom
   GET → `(departments, read)` is dropped.

## Proxies

- **Row 27 — `/admin/organization/permissions` (the read-only matrix page).**
  No dedicated `permissions` resource exists in `ResourceType`. The page is a
  governance view of the role model; gated `[O,A,M]` (any member). Mapped as a
  **proxy** to `(members, read)`. If enforcement is ever wired here, treat
  "can read the permission model" as equivalent to "can read members". The
  Etapa V2.4 UI should label this as a model view, not an enforced capability.

## Ghost resources — declared in the model, no `requireOrgRole` route

These `ResourceType` values exist in `ROLE_PERMISSIONS` (the declared matrix) but
have **zero** `requireOrgRole` call-sites to attach `can()` to. They are
aspirational model, not an enforcement surface in V2. Etapa V2.4 should mark them
in the UI as **"model — no surface yet"** (not "enforced").

| resource | why no org-role route | trigger to revisit |
|---|---|---|
| `org_billing` | no org-scoped billing route exists | billing admin routes land org-scoped |
| `org_settings` | settings reads/writes are not behind `requireOrgRole` | org settings routes adopt org-role |
| `audit_log` | no audit-log read UI/route yet | audit-log viewer route added |
| `integrations` | the 6 integration routes use **`requireSuperAdmin`** (platform-level), **out of scope** of org-scoped `can()` | per-org integration management |
| `blocks_schema` | no org-role route (blocks admin is super-admin / unguarded) | org-scoped blocks schema routes |
| `blocks_data` | no org-role route | org-scoped blocks data routes |

**Coverage:** wiring `can()` today reaches **5 of 11** resources (`org`,
`org_hierarchy`, `members`, `departments`, `locations`). The other 6 are
declared-only until they grow org-scoped routes.

## Decisions cravadas applied (reference)

- **D4** restore → `(org, update)`.
- **D5** dissolve → `(org, delete)` (soft step; hard-delete `DELETE /api/org/[id]`
  also `(org, delete)`).
- **D6** invitations POST → `(members, invite)`; **GET** → `(members, read)`
  (corrected from "DELETE").
- **D7** revoke → `(members, invite)`.
- **D8** dept-members POST **and DELETE** → `(departments, update)` scope
  `department`, scopeId = deptId (corrected from "GET/POST → read+update").
- **D9** permissions page → `(members, read)` proxy.
- **D10** 6 ghost resources recorded above; `integrations` is `requireSuperAdmin`.

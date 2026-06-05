# Runbook — flipping `CAN_ENFORCEMENT` safely

> **⚠️ PROD STATE (2026-06-02) — READ BEFORE ANY FLIP.** PROD is in the safe
> resting state: the `role_permissions` migration is **applied** and the table is
> **seeded with the canonical matrix (97 grants)** — Step 1 (migrate) and Step 2
> (seed) are both done. `CAN_ENFORCEMENT` is **unset (`off`)**. Because the
> canonical matrix mirrors the role-name gates exactly, flipping to `shadow`/
> `enforce` would be **inert** until someone deliberately edits a grant.
>
> **Load-bearing gate (principle):** never flip `shadow`/`enforce` while
> `role_permissions` is **empty** — `enforce` + an empty matrix = every `can()`
> denies = **org-wide lockout**. This gate is **currently satisfied** (the matrix
> is seeded); re-verify the row count is non-zero and canonical before any flip.
> A runtime fail-open guardrail (deny→allow when the matrix is empty) is
> **deferred to Fase 4 (Fork B)** — until it lands, the seed is the only
> protection against the empty-matrix lockout. Before any PROD flip, still run the
> shadow-observation step below against PROD's matrix.

**What the flip does.** `CAN_ENFORCEMENT` gates the `can()` enforcement layer
(`enforce()`/`enforceRoute()` adopted in all 25 org-scoped route call-sites).

| value | effect |
|---|---|
| `off` (default) | `enforce()` is a no-op; `can()` never runs. `requireOrgRole` is the only gate. |
| `shadow` | `can()` runs alongside `requireOrgRole` and logs agreement/divergence (`[can-shadow]`) but never changes the result. Observation only. |
| `enforce` | `can()` denials tighten the gate (403) on top of `requireOrgRole`. The matrix is live. |

**Read at call time** (`getCanEnforcementMode()` reads `process.env.CAN_ENFORCEMENT`
per request) → flipping is **env-only, no code deploy, effect is immediate**, and
**reversible instantly** (`enforce` → `shadow`/`off`).

**Why a runbook.** The risk is not code — it's flipping while the
`role_permissions` matrix is in an unexpectedly-divergent state, which would
produce real `403`s. The procedure below makes the matrix state explicit before
the gate goes live.

## Pre-flip — know the matrix state

1. The matrix lives in the global `role_permissions` table. Its canonical
   (seed) state mirrors the role-name gates exactly — flipping then changes
   nothing (proven: shadow = 100% `agree:true`). Any **deliberate edits** via
   the Permissions editor are where `enforce` will actually bite.
2. Confirm the intended state:
   ```sql
   SELECT role, resource, action, scope_type FROM role_permissions ORDER BY 1,2,3;
   ```
   Compare against intent. To reset to canonical: `npm run seed:role-permissions`
   (idempotent; only adds missing canonical grants — it does NOT remove edits).

## ⚠️ Per-org overrides + deny (Fase 6c) — inert under shadow, BITE on flip

Fase 6c shipped the OWNER-only per-org override editor (`PATCH /api/org/roles/matrix`,
grid at `/admin/organization/role-overrides`). An OWNER can now write **per-org
`deny` rows** (`role_permissions` with `tenant_id = orgId`, `effect = deny`).

Under `shadow`/`off` these denies are **INERT** — the loader resolves them but
`enforce()` doesn't apply, so `requireOrgRole` still grants. **At the instant of the
flip to `enforce`, every existing deny starts NEGATING for real.** The OWNER floor
(`roles.{create,read,update,delete}` + `members.update`) is protected in BOTH the
loader and the editor (422), so an OWNER can't self-lock; ADMIN/MEMBER/custom roles
have no floor and CAN be emptied by a deny.

**Before flipping `enforce` in PROD, audit existing per-org denies** (they were
invisible under shadow):
```sql
SELECT tenant_id, role, role_id, resource, action
FROM role_permissions WHERE effect = 'deny' ORDER BY 1,2;
```
Each row is a real `403` that turns on at the flip — confirm each is intended.

## Safe flip sequence

1. **(a) Matrix in a known state** — canonical seed, or your deliberate edits.
2. **(b) Observe in shadow** — set `CAN_ENFORCEMENT=shadow` and exercise the
   app (or run the integration suite):
   ```
   CAN_ENFORCEMENT=shadow npm run test:integration -- --disable-console-intercept
   ```
   Grep the `[can-shadow]` lines. **Every `agree:false` is a route that will
   start returning 403 after the flip** — confirm each is intended.
3. **(c) Flip to enforce** and re-run the suite (or smoke prod):
   ```
   CAN_ENFORCEMENT=enforce npm run test:integration -- --disable-console-intercept
   ```
   With a canonical matrix this passes 100% (matrix == gates). Anything breaking
   beyond your intended divergences is a stop signal.
4. **(d) Decide the resting state** — keep `enforce` (going live) or revert to
   `off` (DEV default).

## Rollback (emergency)

`enforce` → `shadow` or `off` is **env-only, immediate, reversible**. If
production starts 403-ing unexpectedly after the flip:

1. Set `CAN_ENFORCEMENT=off` (or `shadow`) in the environment and reload — the
   gate reverts to `requireOrgRole` on the next request. No deploy, no rollback
   of code or data.
2. Then investigate the matrix (`SELECT ... FROM role_permissions`) and the
   shadow logs before re-attempting.

## Production

PROD flip is a **manual, deliberate** step (not done by CI/automation). Set
`CAN_ENFORCEMENT` in the Railway environment variables. Always run step (b)
shadow observation against PROD's matrix first. Keep the rollback one env-var
away.

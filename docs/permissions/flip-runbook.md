# Runbook — flipping `CAN_ENFORCEMENT` safely

> **✅ FLIP EXECUTED — 4c (2026-06-17). PROD is now `CAN_ENFORCEMENT=enforce`.**
> The promotion gate (D16) was green in-window: oracle green (104 asserts), PROD ==
> canonical (`108` grants, 0 override/deny/custom — a residual smoke custom role
> `auditor` + its `locations:read` grant were cleaned back to `108/0/0/0` first),
> denies = 0, and the directed smoke (OWNER/ADMIN/MEMBER non-super in Bucked Up)
> logged **100% `agree:true`, zero `agree:false`**.
>
> - **Flip:** `CAN_ENFORCEMENT=enforce` set in Railway + redeploy.
> - **Deploy:** `bb370a6d` (commit `a551201f`), instance RUNNING.
> - **`FLIP_START`:** `2026-06-17T00:22:51Z`.
> - **Post-flip vigilance:** ~34 min read-only watch of `[can-enforce-block]` +
>   server errors → **0 blocks, 0 new errors** across ~18 consecutive ticks.
> - **Verdict:** STABLE — inert in practice (matrix == gates), no regression.
> - **Rollback (if needed):** `CAN_ENFORCEMENT=shadow` (or `off`) in Railway +
>   redeploy — env-only, immediate, no schema/code. See "Rollback (emergency)"
>   below. The flip and any rollback are **deliberate human acts in the chat**;
>   the log collector is read-only and never flips.


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

## Promotion gate: shadow → enforce in PROD (D16)

**Supersedes the volume-based gate** (the old "≥500 shadow requests / ≥24h
observation"). PROD is pre-traffic — too few users for a volume threshold to be
comparable — so promotion is gated on **deterministic evidence**, not request
counts. Flip to `enforce` in PROD only when ALL four are green in the same window:

1. **Oracle green** — `can()` == `ENFORCEMENT_MAP` across the 33 routes.
   Deterministic, no traffic: `src/lib/permissions/__tests__/can-authoritative.test.ts`.
2. **PROD == canonical** — reconfirmed in-window: 108 grants, **zero**
   override/deny/custom rows (`SELECT count(*) FROM role_permissions` and the deny
   query below).
3. **Denies = zero** — reconfirmed in-window. Each deny becomes a real `403` at the
   flip (see the deny audit above); zero denies = the flip is inert by construction.
4. **Directed smoke** — test accounts for OWNER / ADMIN / MEMBER exercise the 3
   Owner-only routes + a sample of the O_A routes under `shadow`; **100% `agree:true`**
   confirmed in the `[can-shadow]` log.

**Mitigations that make the swap safe:** `requireOrgRole` stays active (D7,
defense-in-depth) · rollback is env-only, no schema (`enforce`→`shadow`+redeploy) ·
blast radius is minimal (pre-traffic, few users).

**Trade-off accepted consciously:** the directed smoke does NOT cover paths that
only organic traffic would reveal — covered instead by the oracle (33 routes) + the
redundant `requireOrgRole` guard.

**Roles of the actors:** the flip stays a **deliberate human act in the chat**. Any
log collector / reader is **read-only and never flips** `CAN_ENFORCEMENT`.

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
`CAN_ENFORCEMENT` in the Railway environment variables. Before flipping, confirm
the four-point **Promotion gate (D16)** above is green in the same window; the
shadow observation in step (b) is how criterion 4 (directed smoke) is gathered.
Keep the rollback one env-var away.

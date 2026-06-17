# Roles & Permissions — tech debt (post-enforce closeout)

Consolidated known debt at the close of the enforcement epic (`CAN_ENFORCEMENT=enforce`
live in PROD, 2026-06-17). None of these block the flip; each is tracked with a trigger.
Docs-only at closeout — no runtime code was changed here.

## Correctness / bugs

- **`departments` detail crash (suspected client-side `TypeError` on render).** Reported
  during the smoke; server logs for the window showed the departments routes passing auth
  (`agree=true`) with **no server error** — points to a client render error (RSC/React) or a
  500 whose HTTP log had already rolled. **Not confirmed.** Trigger to act: reproduce with
  DevTools (Network + Console) open to capture the exact status/stack, OR pull `railway logs
  --http` immediately after the repro.

- **Roles create handler `catch` only maps `P2002`.** `POST /api/org/roles` rethrows any
  non-`P2002` Prisma error → 500 (e.g. an unexpected constraint), and the modal historically
  showed only a generic toast. The `description:null` 400 contract bug was fixed (PR #172,
  `.nullish()` + in-modal surfacing of all 4xx/5xx), but the server-side `catch` could still
  surface clearer diagnostics instead of a bare rethrow. Trigger: next unexplained 500 on a
  roles mutation.

## Gating / UX

- **`departments` UI not gated by `useCan`.** Unlike `members`/`roles`/`permissions` (which gate
  edit controls via `useCan`/`isSuperAdmin`), the departments screens' mutate controls were not
  confirmed to gate on `can()`. Under enforce the *server* blocks unauthorized writes regardless,
  but a non-authorized viewer may still see editable-looking controls (then 403). Trigger: audit
  the departments client for `useCan` parity; fold into the next departments change.

- **Sidebar role label shows "User" for super_admin accounts.** A super_admin who logs in via the
  regular credentials path gets `session.role = "user"` (JWT) while power comes from the DB
  `isSuperAdmin = true` flag. The sidebar derives the label from the role string → shows "User"
  for an account that bypasses every gate. Caused two false-alarm "user edits others' permissions"
  reports (Bucked Up members + Permissions matrix — both were the super_admin Nick). **Cosmetic,
  not a security issue.** Fix: derive the label from `isSuperAdmin` → "Super Admin". Trigger:
  next UX pass on the sidebar profile block.

## Performance / architecture

- **`loadRoleMatrix()` has no cross-request cache.** `can()` reads `role_permissions` per check
  (1 extra query per `can()`); now that `enforce` is live, this runs on the hot path. Trigger:
  p99 on org-scoped routes rises, OR `can()` checks per request grow. Fix: cache with invalidation
  on the grant `PATCH`.

- **Remove the hardcoded `ROLE_PERMISSIONS` once the DB matrix is proven stable.** The V1
  hardcoded map (`src/lib/permissions/role-permissions.ts`) is retained as the seed source +
  parity oracle. With the DB-driven matrix live and stable under enforce, it can eventually be
  dropped (or reduced to a seed-only artifact). Trigger: a sustained stable window under enforce
  + a decision that the DB matrix is the sole source of truth.

## Domain / routing (post-flip)

- **Redirect `app.comecaai.com.br` → `www`.** Decision: the platform/admin host should be `www`;
  `app.*` currently resolves to the ComeçaAI org (subdomain `app`). A redirect needs an
  **anti-loop guard** because the post-login flow (`loginAction`) routes apex+single-org logins to
  the org subdomain — a naive `app→www` redirect would fight that. Deferred to post-flip.

- **`:8080` port leak in the invalid-subdomain redirect.** `proxy.ts` (org_not_found guard) clones
  `request.nextUrl` and preserves the internal `:8080` port → redirects to
  `https://comecaai.com.br:8080/?error=org_not_found`, which breaks (LB serves 443). Low impact
  (only invalid subdomains). Fix: strip the port / build the URL from `APEX_HOST` without port.

## UI improvements (captured shorthand — detail when picked up)

Four small UX improvements noted during the epic, to be scoped when addressed:
- **"1 permission"** — surface/affordance for a single-permission case.
- **TAB** — keyboard tab navigation through the matrix/forms.
- **split roles** — split the roles view/layout.
- **Enter** — submit forms on Enter key.

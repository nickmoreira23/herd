-- Sub-etapa 4 — Fix `current_app_tenant_id()` to return NULL on empty GUC.
--
-- `current_setting('app.tenant_id', TRUE)` returns the empty string `''` when
-- the GUC was never set on the connection (with `missing_ok = TRUE`). When the
-- RLS policy then evaluates `tenant_id = current_app_tenant_id()::uuid` it
-- attempts `''::uuid`, which raises `invalid input syntax for type uuid`.
--
-- Wrapping in `NULLIF(..., '')` collapses empty-string to NULL so the policy
-- evaluates `tenant_id = NULL` → false → row hidden. Same end behavior as
-- "deny without GUC" but no exception leaks into Prisma queries that don't
-- pass through the Extension's `withTenant` wrapping (e.g. no-context calls
-- in defense-in-depth assertions).

CREATE OR REPLACE FUNCTION current_app_tenant_id()
RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.tenant_id', TRUE), '');
$$ LANGUAGE sql STABLE;

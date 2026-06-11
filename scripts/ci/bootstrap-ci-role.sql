-- CI adaptation of scripts/bootstrap-supabase-project.sh (role + GRANTs only).
-- Targets the throwaway postgres:16 service container in GitHub Actions —
-- fixed password is intentional (DB dies with the job). Apply AFTER
-- `prisma migrate deploy`, then apply scripts/enable-rls.sql.
--
-- NOBYPASSRLS is the load-bearing property: RUNTIME_DATABASE_URL connects as
-- herd_app so the RLS integration tests exercise real policies.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'herd_app') THEN
    CREATE ROLE herd_app WITH LOGIN PASSWORD 'herd_app_ci' NOBYPASSRLS;
    RAISE NOTICE '[ci-bootstrap] Created herd_app role';
  ELSE
    RAISE NOTICE '[ci-bootstrap] herd_app role already exists — skipping create';
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO herd_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO herd_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO herd_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO herd_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO herd_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO herd_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO herd_app;

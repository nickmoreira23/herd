#!/usr/bin/env bash
# Bootstrap a fresh Supabase project for HERD.
# Idempotent setup of herd_app role + GRANTs + enable-rls.sql.
# Pre-requisite: prisma migrate deploy already ran against this project.
#
# Usage:
#   DIRECT_URL=postgresql://... bash scripts/bootstrap-supabase-project.sh
#
# Cravado na Sub-etapa 17.0.11 — paga dívida da Sub-etapa 4.

set -euo pipefail

if [ -z "${DIRECT_URL:-}" ]; then
  echo "ERROR: DIRECT_URL env var required"
  exit 1
fi

echo "[bootstrap] Connecting to $(echo $DIRECT_URL | sed 's|://[^@]*@|://***@|')..."

HERD_APP_PASSWORD=$(openssl rand -hex 24)

psql "$DIRECT_URL" <<SQL_EOF
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'herd_app') THEN
    CREATE ROLE herd_app WITH LOGIN PASSWORD '$HERD_APP_PASSWORD' NOBYPASSRLS;
    RAISE NOTICE '[bootstrap] Created herd_app role';
  ELSE
    RAISE NOTICE '[bootstrap] herd_app role already exists — skipping create';
  END IF;
END
\$\$;

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
SQL_EOF

echo "[bootstrap] herd_app role + GRANTs applied"
echo ""
echo "[bootstrap] herd_app password (anote em password manager):"
echo "  $HERD_APP_PASSWORD"
echo ""

if [ -f "scripts/enable-rls.sql" ]; then
  echo "[bootstrap] Applying enable-rls.sql..."
  psql "$DIRECT_URL" -f scripts/enable-rls.sql
  echo "[bootstrap] enable-rls.sql applied"
else
  echo "WARNING: scripts/enable-rls.sql not found"
fi

echo ""
echo "[bootstrap] ✓ Done."

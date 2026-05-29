-- Sub-etapa 26.1 — Árvore estrutural de organizações (ADR-001, Escopo C faseado).
--
-- Muda o FK self-referencial parent_org_id de ON DELETE SET NULL para
-- ON DELETE CASCADE: dissolver fisicamente uma org-pai apaga recursivamente
-- todo o subtree (e, por cascata já existente nas demais FKs, os dados de
-- cada org do subtree). A destruição da árvore só acontece no hard-delete
-- (passo 2 do fluxo de dissolução); o soft-delete (ACTIVE→ARCHIVED) NÃO toca
-- parent_org_id de ninguém.
--
-- Adiciona também um CHECK barato como defense-in-depth contra self-reference
-- direto (org pai de si mesma). Ciclos transitivos (A→B→A) continuam barrados
-- na aplicação via assertNoCycle (WITH RECURSIVE) — o CHECK só cobre o caso
-- direto, que é o mais barato de pegar no banco.
--
-- NÃO toca RLS/policies/Extension/TENANT_SCOPED_MODELS (organizations não é
-- tenant-scoped). Risco baixo.

-- 1. Troca o onDelete da FK self-referencial: SET NULL → CASCADE.
--    DROP + ADD explícito (não um ALTER silencioso) para garantir que o novo
--    onDelete seja efetivamente aplicado. ON UPDATE CASCADE preservado.
ALTER TABLE "organizations"
  DROP CONSTRAINT IF EXISTS "organizations_parent_org_id_fkey";

ALTER TABLE "organizations"
  ADD CONSTRAINT "organizations_parent_org_id_fkey"
  FOREIGN KEY ("parent_org_id") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. CHECK self-reference direto (defense-in-depth).
ALTER TABLE "organizations"
  DROP CONSTRAINT IF EXISTS "organizations_no_self_parent_check";

ALTER TABLE "organizations"
  ADD CONSTRAINT "organizations_no_self_parent_check"
  CHECK ("parent_org_id" IS NULL OR "parent_org_id" <> "id");

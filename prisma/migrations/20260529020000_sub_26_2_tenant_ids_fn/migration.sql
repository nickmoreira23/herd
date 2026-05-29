-- Sub-etapa 26.2 — função SQL para leitura vertical (ADR-001, mecanismo 3.1).
--
-- Cria APENAS a função current_app_tenant_ids() (array: self + descendentes),
-- consumida pelas policies de leitura a partir da T3. NÃO toca nenhuma policy
-- aqui — o isolamento de produção permanece exact-match (current_app_tenant_id)
-- até a migration de policies da T3. Reversível e inerte: nada lê esta função
-- até as policies mudarem.
--
-- Espelha current_app_tenant_id() (NULLIF + STABLE). GUC unset → NULL, e
-- `tenant_id = ANY(NULL)` é NULL → deny (consistente com no-GUC deny).

CREATE OR REPLACE FUNCTION current_app_tenant_ids()
RETURNS uuid[] AS $$
  SELECT string_to_array(NULLIF(current_setting('app.tenant_ids', TRUE), ''), ',')::uuid[];
$$ LANGUAGE sql STABLE;

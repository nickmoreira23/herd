# Hand-off — Marketplace Fase 0: deploy travado, DNS/domínios e rumo à SE4

> **Para quem pega isto numa sessão nova (contexto zero).** Este documento resume onde o
> trabalho de Marketplace (Fase 0 — Hardening) parou, o que já está garantido, e três
> frentes abertas para retomar: **(A)** o deploy de PROD que falhou, **(B)** a camada de
> DNS/domínios (sem ela o multi-tenant por host não funciona em PROD), e **(C)** a próxima
> sub-etapa, **SE4 (auth org-scoped)**.
>
> Data do hand-off: 2026-06-03. Repo: `~/Desktop/Projects/HERD`. Branch base: `main`.

---

## 0. Estado atual (o que JÁ está feito e merjado)

Fase 0 do plano-mestre "Camada Marketplace" (Mundo A, single-sided). Tudo abaixo está em `main`:

| Sub-etapa | O que entregou | PR |
|---|---|---|
| **SE1** | Lock interino: `requireSuperAdmin` nas 4 rotas de escrita de seções | #128 |
| **SE2** | Rede de characterization tests (baseline pré-refactor) | #130 |
| **SE2.5** | Fix de data-loss no PATCH (Zod `.partial()` vazava `.default()`) + diff de scopes | #131 |
| **SE3** | **Per-tenant scoping**: `tenant_id` NOT NULL + FK + RLS nas tabelas do Marketplace; `/explore` e escritas sob `withTenant(getOrgIdFromRequest())`; slug agora `@@unique([tenantId, slug])` | #136 |

- `main` HEAD na entrega da SE3: commit **`97a5197`**.
- Migration da SE3: **`prisma/migrations/20260602235000_marketplace_per_tenant`**.
- **Aplicada em PROD manualmente** (via `railway run -- npx prisma migrate deploy`) em 2026-06-03.
  - Verificação estrutural em PROD passou: `tenant_id` (1/1), 4 políticas RLS, índice composto slug — tudo OK.
  - Isolamento provado por teste automatizado (`src/app/api/marketplace/__tests__/tenant-isolation.integration.test.ts`): **5/5** contra DB real com RLS.

**Conclusão:** o coração da SE3 — isolamento por organização no banco (RLS) — está **vivo e provado em produção**. As frentes abaixo são o que falta para *exercitar* isso de ponta a ponta e seguir o plano.

### Como aplicar migrations em PROD (contrato do projeto)
PROD é **manual** (ver `AGENTS.md › "Database migrations" › "🛑 PROD migrations are MANUAL"`):
```sh
railway run -- npx prisma migrate deploy
railway run -- npx prisma migrate status   # deve imprimir "Database schema is up to date!"
```
O predeploy do Railway **não** aplica migrations (imagem runner sem CLI/`prisma/`).

---

## Frente A — Deploy de PROD que FALHOU (code ↔ DB drift)

### Sintoma
`railway status` em 2026-06-03 mostrou:
```
herd: ● Online · Deploy failed (14h 17m) · https://herd-production.up.railway.app
```
- Service ID: `1771ee49-078e-4b25-a4e4-337dede377bf`
- Deployment ID (na época): `e116c783-b756-4f8a-ad3f-7592da05cecb`

### Por que importa
Aplicamos a **migration da SE3 no banco de PROD**, mas o **último deploy de código falhou** (~14h
antes). Ou seja, é provável que o app rodando em PROD seja uma versão **anterior à SE3**, enquanto o
**banco já está na SE3**. Isso é um descompasso:
- O banco agora tem `tenant_id NOT NULL` + RLS nas tabelas de Marketplace.
- Código pré-SE3 não envolve as queries de Marketplace em `withTenant`, então a RLS **nega** essas
  leituras/escritas (retorna vazio ou erro de `NOT NULL`).
- **Blast radius hoje é baixo** porque o Marketplace nem é acessível por org no host único atual
  (ver Frente B). Mas é uma inconsistência que deve ser resolvida levando o código à mesma altura do banco.

### O que investigar (próxima sessão)
1. Ver por que o build/deploy falhou:
   ```sh
   railway logs --deployment   # logs do último deploy (ou via painel Railway → service "herd" → Deployments)
   ```
   Causas comuns neste projeto: erro de `next build` (Cache Components — ver `AGENTS.md › Next.js 16
   Cache Components`), ou predeploy. Rodar `npm run build` local no **repo principal** (não worktree)
   costuma reproduzir.
2. Confirmar qual commit está efetivamente rodando em PROD vs `main` (`97a5197` ou posterior).
3. Corrigir a causa do build e **re-deployar** para que o código alcance o banco (SE3).
4. Pós-deploy, validar que rotas `/api/marketplace/*` e `/explore` não dão 500.

### Plano B (se a RLS bloquear leitura legítima após o deploy correto)
Mitigação rápida e reversível — desarma só a RLS sem apagar dados (rodar como **owner** no SQL Editor
do Supabase de PROD; `DROP POLICY` exige dono da tabela):
```sql
DROP POLICY IF EXISTS "marketplace_sections_tenant_isolation"       ON "marketplace_sections";
DROP POLICY IF EXISTS "marketplace_sections_vertical_read"          ON "marketplace_sections";
DROP POLICY IF EXISTS "marketplace_section_scopes_tenant_isolation" ON "marketplace_section_scopes";
DROP POLICY IF EXISTS "marketplace_section_scopes_vertical_read"    ON "marketplace_section_scopes";
ALTER TABLE "marketplace_sections"       DISABLE ROW LEVEL SECURITY;
ALTER TABLE "marketplace_section_scopes" DISABLE ROW LEVEL SECURITY;
```
Investigar a causa antes de re-habilitar. (Não deve ser necessário se o código SE3 estiver deployado.)

---

## Frente B — DNS / domínios (multi-tenant por host não funciona em PROD ainda)

### O problema central
A resolução de tenant é **por host** (`src/lib/tenant/org-resolver.ts` → `resolveOrgByHost`):
1. casa `custom_domain` exato; **ou**
2. extrai subdomínio de `comecaai.com.br` / `lvh.me`; **senão** retorna `null`.

Hoje em PROD:
- Único host: **`https://herd-production.up.railway.app`** (não é apex conhecido, não é `.comecaai.com.br`).
- `comecaai.com.br` **não tem DNS** (navegador retorna `DNS_PROBE_FINISHED_NXDOMAIN`).
- Nenhuma org tem `custom_domain` (todos `NULL` — confirmado por query).

→ `resolveOrgByHost("herd-production.up.railway.app")` retorna **`null`** para toda requisição.
Logo, em PROD hoje: `/explore` cai em "sem storefront", admin de Marketplace fica vazio, e escritas
dão 400. **Não é bug da SE3** — é a camada de domínios que não existe em produção ainda.

### O que precisa ser feito (próxima sessão / sub-etapa de infra)
Escolher e montar **uma** das abordagens (idealmente a primeira, que casa com Sub-etapa 22/23):
1. **Wildcard DNS de `comecaai.com.br`** apontando para o Railway, + registrar o apex e
   `*.comecaai.com.br` como domínios no serviço Railway. Aí `app.comecaai.com.br`,
   `jeff.comecaai.com.br`, etc. resolvem org por subdomínio (o mecanismo que o código já espera).
   - Verificar `APEX_HOSTS` e `extractSubdomain` em `src/lib/tenant/org-resolver.ts` — já contemplam
     `comecaai.com.br` em produção. Confirmar `NEXTAUTH_URL`, `COOKIE_DOMAIN=.comecaai.com.br`,
     `APEX_HOST=comecaai.com.br` no ambiente de PROD (ver `AGENTS.md › Cross-subdomain cookies`).
2. **Domínio próprio por org** (`custom_domain`) — preencher `organizations.custom_domain` para a org
   e apontar o DNS dela ao Railway. Mais trabalhoso por org; serve casos enterprise.

### Como testar o isolamento no navegador (DEPOIS que os domínios estiverem no ar)
Orgs ACTIVE em PROD (de `SELECT name, subdomain, custom_domain, status FROM organizations WHERE status='ACTIVE'`):
- **ComeçaAI** → subdomain `app`
- **Personal — nick@getpumped.ai** → subdomain `nick`
- **Personal — jeff@buckedup.com** → subdomain `jeff`
- ⚠️ 3 orgs `test-tenancy-…` → **lixo de teste** (ver Frente C, item de higiene)

Teste (com domínios live, ex.: `<sub>.comecaai.com.br`):
1. Logar no admin da Org A (`<subA>/admin/marketplace`), criar seção simples **publicada**.
2. `<subA>/explore` → seção **aparece**. ✅
3. `<subB>/explore` (outra org) → seção **não aparece**. ✅

---

## Frente C — Rumo à SE4 (auth org-scoped)

### O que é a SE4 (do plano-mestre Fase 0)
Trocar o **lock interino `requireSuperAdmin`** (SE1) nas rotas de escrita de Marketplace pelo
**RBAC org-scoped** (`can()` / `requireOrgRole`) escopado por `section.tenantId`. Done: owner/admin da
org edita as seções **da sua org**; cross-org negado.

### Pré-flight OBRIGATÓRIO antes de cravar a spec da SE4
O RBAC mudou durante a SE3 (entraram na `main` via rebase):
- **PR #134** — `Role` table tenant-scoped + RolePermission híbrido + loader merge.
- **PR #135** — `can()` autoritativo + refino de taxonomia.

Implicações a revalidar (são read-only; rodar antes de escrever a spec):
1. **`ResourceType` ainda NÃO tem `marketplace`/`sections`** (`src/lib/permissions/types.ts`). O mais
   próximo é `blocks_data`/`blocks_schema`. Decidir: adicionar um resource `marketplace` à matriz, ou
   mapear para `blocks_data`. Isso é decisão de schema de permissões.
2. **`requireOrgRole(allowedRoles: MemberRole[])`** (`src/lib/permissions/require-org-role.ts`) já
   resolve org por `x-org-id` (host) + checa membership/role; mesmo shape `Session | Response` do
   `requireSuperAdmin`. É o substituto direto nas rotas de escrita.
3. **`getActor(session)`** (`src/lib/permissions/get-actor.ts`) entrega org + roles (`MemberRole`,
   escopo org/dept) — é a fonte para um `getViewerContext` real (hoje devolve `profileTypeId:null`).
4. Revisar se `can()`/enforcement (flag `CAN_ENFORCEMENT`, hoje `off`) muda algo no roteamento das
   escritas de Marketplace.

### Dependência de ordem
A SE4 escopa o guard por `section.tenantId` — só faz sentido **depois** da SE3 (já merjada ✓). A SE4
**não** depende das Frentes A/B (deploy/DNS): é trabalho de código + testes, validável por unit tests
(que não exigem DB nem domínio). Pode tocar a SE4 em paralelo a resolver deploy/DNS.

### Depois da SE4 (contexto do plano)
- **SE5 — visibilidade dois-eixos** (peça central, reescopada): RBAC interno × exposição pública
  granular. **Não existe campo de "public exposure" no schema** (só o enum `status`
  DRAFT/PUBLISHED/ARCHIVED). É modelagem nova. Os arrays órfãos
  `allowedProfileTypeIds`/`allowedRoleIds` (apontavam para modelos removidos na Fase 3) devem ser
  substituídos: `allowedRoleIds` → `MemberRole[]`; `allowedProfileTypeIds` → descartar.
- **SE6 — Zod na borda do JSON** (`components`/`layout`), usando `component-registry` como fonte. Reduzida.

---

## Apêndice — aprendizados e dívidas registradas nesta sessão

1. **PROD tinha resíduo de demo** ("Supplements"/"Products", criados 27/abril) que DEV não tinha. A
   migration `NOT NULL` falhou na 1ª tentativa por causa disso → resolvido apagando a demo (decisão
   #9 do plano: demo descartável). **Lição: sempre conferir contagem em PROD; nunca assumir o estado do DEV.**
2. **Migration que falha pode deixar estado parcial neste setup (Supabase via pooler).** A 1ª
   tentativa removeu o índice antigo de slug **antes** de falhar e **não** desfez isso sozinha. Foi
   preciso recriar o índice manualmente e depois `prisma migrate resolve --rolled-back` + `migrate
   deploy`. **Lição: após falha de migration, verificar o schema real (colunas/índices) antes de
   reaplicar.** Sequência de recuperação que funcionou:
   ```sql
   -- (recriar o que a migration parcial removeu, com tabelas vazias)
   CREATE UNIQUE INDEX "marketplace_sections_slug_key" ON "marketplace_sections"("slug");
   ```
   ```sh
   railway run -- npx prisma migrate resolve --rolled-back "20260602235000_marketplace_per_tenant"
   railway run -- npx prisma migrate deploy
   ```
3. **3 orgs `test-tenancy-…` em PROD** (subdomains `test-tenancy-1778864…`) — sobras de testes de
   integração cujo cleanup falhou (ou que rodaram com env apontando para PROD). **Item de higiene:**
   investigar por que testes criaram orgs em PROD e fazer limpeza controlada. NÃO mexer sem verificar.
   Query para inspecionar:
   ```sql
   SELECT id, name, subdomain, status, "createdAt" FROM organizations
   WHERE name ILIKE 'Tenant %' OR subdomain LIKE 'test-tenancy-%';
   ```

## Arquivos-chave (mapa rápido)
- Tenancy/host: `src/lib/tenant/org-resolver.ts`, `src/lib/tenant/get-org-from-request.ts`, `src/proxy.ts`
- Extension RLS: `src/lib/tenancy/prisma-extension.ts` (`TENANT_SCOPED_MODELS`), `src/lib/tenancy/context.ts` (`withTenant`)
- Marketplace API: `src/app/api/marketplace/sections/**`
- Marketplace público: `src/app/[locale]/explore/**`
- Marketplace admin: `src/app/admin/marketplace/**`
- Permissões (SE4): `src/lib/permissions/{types,require-org-role,get-actor,can,role-permissions}.ts`
- Migration SE3: `prisma/migrations/20260602235000_marketplace_per_tenant/migration.sql`
- Teste de isolamento: `src/app/api/marketplace/__tests__/tenant-isolation.integration.test.ts`

# Architect State — ComeçaAI Fase 4

> **Propósito:** Este arquivo é o estado canônico cross-session do trabalho de chat-architect em curso. Atualizado ao final de cada sub-etapa Fase 4. Qualquer nova sessão Claude.ai (chat-architect) deve ler este arquivo PRIMEIRO antes de propor qualquer trabalho.
>
> **Versão:** v1.2 (atualizado 2026-05-29, pós-merge Sub-etapa 25 — PR #88, merge `fdc7a75`)
>
> **Próxima atualização esperada:** pós-merge Sub-etapa 26 (Sub-org hierarchy).

---

## 1. Identidade da plataforma

- **Nome:** ComeçaAI (rebrand de HERD em Sub-etapa 18).
- **Repo:** `github.com/nickmoreira23/herd`.
- **Path local:** `/Users/nickmoreira/Desktop/Projects/HERD/`.
- **Stack:** Next.js 16 (Turbopack, App Router, Cache Components), Prisma 7, NextAuth v5, Tailwind, Supabase Postgres + RLS.
- **Hospedagem:** Railway (PROD) + local DEV.
- **Owner platform super_admin:** `nick@comecaai.com.br`.
- **Domain:** `comecaai.com.br` (GoDaddy → planejado Cloudflare cutover Sub-etapa 28.5).

---

## 2. Sub-etapas Fase 4 — status canônico

| # | Sub-etapa | Status | Merge hash | Archive tag |
|---|---|---|---|---|
| 1 | 18 — Rename + Foundation | ✅ | — | archive/sub-etapa-18-* |
| 2 | 18.1 — Rename batch | ✅ | — | archive/sub-etapa-18-1-* |
| 3 | 19 — Tenant scope (Dept/Loc) | ✅ | — | archive/sub-etapa-19-* |
| 4 | 20 — Membership + Roles | ✅ | — | archive/sub-etapa-20-* |
| 5 | 20.1 — Drop Organization.ownerId | ✅ | — | archive/sub-etapa-20-1-* |
| 6 | 21 — Permissions + RBAC | ✅ | — | archive/sub-etapa-21-* |
| 7 | 22 V2 — Domain routing foundation | ✅ | a19d2e9 | archive/sub-etapa-22-v2-* |
| 8 | 23 — Bucked Up DEV + host-based tenant | ✅ | 8ab3a17 | archive/sub-etapa-23-* |
| 9 | 22.1 — Cookie domain + apex redirect | ✅ | — | archive/sub-etapa-22-1-* |
| 10 | 22.1.1 — lvh.me hotfix | ✅ | — | archive/sub-etapa-22-1-1-* |
| 11 | 22.1.2 — Login server action | ✅ | — | archive/sub-etapa-22-1-2-* |
| 12 | 22.1.3 — Cloudflare cleanup (Opção A) | ✅ | — | archive/sub-etapa-22-1-3-* |
| 13 | 22.2 — Org selector + login branding + switch-org | ✅ | f5d2b6e | archive/sub-etapa-22-2-org-selector-f5d2b6e |
| 14 | **24 — Invitation flow + EmailProvider mock** | ✅ | `9149412` (PRs #77→#85) | — |
| 15 | **25 — Audit log** | ✅ | `fdc7a75` (PR #88) | — |
| 16 | 26 — Sub-org hierarchy | ⏭️ pending | — | — |
| 17 | 27 — UI consolidation | ⏭️ pending | — | — |
| 18 | 28 — Smoke harness DEV | ⏭️ pending | — | — |
| 19 | 28.5 — Domain cutover + Resend + Bucked Up PROD | ⏭️ pending | — | — |

**Progresso:** 15/17 cravadas (88%).

---

## 3. Pendência ativa

### Sub-etapa 25 (Audit log) — ✅ MERGED (2026-05-29)

Entregue em PR #88 (single squash, merge `fdc7a75`), branch `feat/sub-25-audit-log`.
Estrutura: 1 commit base (schema + migration + helper) + 2 commits de instrumentação.

**Cravado:**
- `model AuditLog` tenant-scoped estrito (molde `BillingEvent`): `tenant_id NOT NULL`
  (FK Organization CASCADE), `actor_profile_id` nullable (FK NetworkProfile SET NULL),
  `resource_id String` genérico, `metadata Json`, 5 índices. Registrado em
  `TENANT_SCOPED_MODELS`.
- **RLS estrita (lição #82):** policy única `audit_logs_tenant_isolation`, SEM
  `herd_app_full_access` permissivo. `WITH CHECK` explícito (superset seguro da
  referência BillingEvent, que confia no `USING` dobrando como write-check) por ser
  tabela write-heavy. Verificada ao vivo no DB DEV antes de marcar applied.
- Migration aplicada cirurgicamente via `DIRECT_URL` (drift DEV pré-existente
  confirmado benigno, NÃO mascarado/resetado) + `migrate resolve --applied`.
- Helper `writeAuditLog` (`src/lib/audit/write-audit-log.ts`): abre o próprio
  `withTenant` (re-entrante), best-effort try/catch — falha de auditoria nunca
  derruba a ação de negócio.
- **6 pontos instrumentados**, todos passando o MESMO tenant do `withTenant`
  envolvente (invariante de correção): invitations (`created`/`accepted` ×2 paths/
  `revoked` na rota fora da transação), departments (`created`/`updated`/`deleted`/
  `member_changed`), locations (`created`/`updated`/`deleted`). Ator = profile que
  EXECUTOU a ação (no accept, a pessoa convidada).

**Finding cravado:** `org-chart/internal` (e `external`) são GET-only — read-only.
O chart é derivado de departments; suas mutações estruturais (reparent, head,
membership) já são auditadas via rotas de department. Nenhum ponto de mutação novo
foi inventado (regra da spec).

**Gate manual recomendado pós-merge:** smoke DEV — exercer uma mutação
(invite/dept/location) e confirmar via SQL que uma linha aterrissa em `audit_logs`
sob o tenant correto. Backend confirmado via gates (typecheck + build + lint + 481
testes em cada commit) e RLS verificada ao vivo; falta só a confirmação end-to-end
de que uma ação real grava a linha.

### Próxima sub-etapa: 26 (Sub-org hierarchy) — ⏭️ pending

Aguardando discovery antecipada antes da spec (regra cravada da skill).

---

## 4. Decisões arquiteturais cravadas (canon)

### Tenancy & routing

- **Host = source of truth pra tenant resolution.** `x-org-id` header injetado por `src/proxy.ts`.
- **`proxy.ts` em Node runtime.** Edge não suporta Prisma. Cloudflare migration foi rejeitada via Opção A.
- **Cookie domain `.lvh.me` em DEV.** Chrome PSL bloqueia `.localhost`.
- **`OrganizationInvitation` NÃO está em `TENANT_SCOPED_MODELS`.** Routes filtram `organizationId` manualmente.

### Auth & sessions

- **Login via server action** (`loginAction` em `src/app/(auth)/login/actions.ts`).
- **NextAuth v5 `trustHost: true`** + secret fallback `NEXTAUTH_SECRET ?? AUTH_SECRET`.
- **Switch-org: redirect subdomain, não JWT update.** POST `/api/auth/switch-org`.
- **JWT `activeOrgId` mantém fallback.** Refactor completo planejado Sub-etapa 28.5.

### Invitation flow (Sub-etapa 24)

- **Design A:** invitation tabela separada, membership criada só no accept.
- **EmailProvider mock V1.** `console.log` + `mockSentEmails[]` in-memory. Resend = Sub-etapa 28.5.
- **Dedup application code** (zero migration).
- **Senha mínima 8 chars.** bcrypt hash.
- **Expiração 7 dias.** Revoke via `expiresAt = now()`.
- **`InvitationStatus.REVOKED` não existe** (e não vai existir nesta sub-etapa).
- **POST `/api/users` removido.** `user-table.tsx` adaptado (dead code, refs limpos).
- **Redirect pós-accept via `AcceptedRedirect` (client) + `buildOrgAdminUrl`.** Server
  action retorna `{redirect}` (happy path), mas o branch terminal `ACCEPTED` em
  `page.tsx` renderiza `<AcceptedRedirect>` que re-emite `window.location.href` no
  mount — neutraliza a race do RSC-revalidation que desmontava o form. URL
  cross-subdomain de fonte única em `src/lib/tenant/org-url.ts` (action + page).
  `redirect()` server-side NÃO usado (não cruza subdomínio sob Turbopack — N2/N3).

### Audit log (Sub-etapa 25)

- **`AuditLog` molde `BillingEvent` estrito.** Tenant-scoped, RLS policy única
  (sem `herd_app_full_access`). `WITH CHECK` explícito.
- **`actorProfileId` nullable + `onDelete: SetNull`.** Ator deletado anonimiza, não
  apaga a trilha.
- **`resourceId String` genérico.** Sem FK tipada — qualquer recurso referenciável.
- **Helper abre o próprio `withTenant`** (re-entrante) e é **best-effort** (try/catch
  log-and-swallow). Auditoria NUNCA derruba a ação de negócio.
- **Ator = profile que EXECUTOU a ação.** No accept de convite, a pessoa convidada.
- **Auditoria gravada DEPOIS do commit da ação** (no accept, FORA do `$transaction`;
  no revoke, na rota fora da transação do service).
- **Invariante de tenant:** todo ponto passa a mesma expressão de tenant do
  `withTenant` envolvente (`session.user.activeOrgId` / `organizationId`).
- **V1 = cobertura sobre completude.** 6 pontos (invitations/departments/locations).
  Role + settings FORA. Read ops não logadas. UI de browse não existe (tech debt).
- **action strings `{recurso}.{verbo}` lowercase.** metadata mínimo-útil, NUNCA
  sensível (sem senha/hash/token completo).

### Schema crítico

- `Organization`: 17 cols, sem `ownerId` (drop 20.1), `subdomain UNIQUE`, `customDomain UNIQUE nullable`.
- `OrganizationMember`: relation name `organizationMemberships`.
- `MemberRole` enum: OWNER, ADMIN, MEMBER, DEPARTMENT_HEAD, DEPARTMENT_MANAGER, DEPARTMENT_MEMBER.
- `MembershipStatus`: ACTIVE, SUSPENDED, INVITED (NÃO USADO), REMOVED.
- `InvitationStatus`: PENDING, ACCEPTED, DECLINED, EXPIRED (sem REVOKED).
- `NetworkProfile.isSuperAdmin Boolean`. Nick = true.
- `AuditLog`: tenant-scoped estrito. `tenant_id`, `actor_profile_id` (nullable),
  `action`, `resource_type`, `resource_id`, `metadata Json`, `created_at`. 5 índices.

### Process discipline

- Squash merge pattern.
- Backup tags `pre-<sub-etapa>-*` antes de mutations.
- Worktrees `.claude/worktrees/<name>/` per sub-etapa.
- Discovery antecipada mandatory antes de cada spec.
- DEV smoke → PR Draft → merge → archive tag → cleanup.
- `npm run build` mandatory pra route handlers / next.config.
- Status reports só no fim da sub-etapa completa.

---

## 5. Tech debt rastreado

### Tier 1 (resolve durante Fase 4)

- `MembershipStatus.INVITED` enum value não-usado (Design A) — Sub-etapa 27 decide drop ou usar.
- `user-table.tsx` dead code — Sub-etapa 27 deleta ou mantém legacy.
- Click-outside dropdown handler sidebar — Sub-etapa 27.
- Default-org persistence — Sub-etapa 27.
- Sidebar dropdown polish — Sub-etapa 27.
- Profile popover sidebar não permite click — Sub-etapa 27.
- Audit log: UI admin para browse/filtrar a trilha — Sub-etapa 27 ou quando produto pedir.
- Audit log: cobertura de role + settings mutations — quando esses pontos existirem.
- ✅ Audit log: smoke end-to-end DEV — VALIDADO (2026-05-29). Write path provado
  (3 rows reais sob tenant ComeçaAI correto: `invitation.created`/`department.created`/
  `location.created`, vistas no Studio) + isolamento cross-tenant provado (BuckedUp
  `count=0` via script read-only usando o `prisma` singleton + `herd_app` NOBYPASSRLS,
  caminho real da app). Lição #82 confirmada ao vivo.

### Tier 2 (resolve em Sub-etapa 28.5 ou cutover)

- Refactor pra abandonar JWT `activeOrgId` completamente.
- Resend integration real (substitui MockEmailProvider).
- Marketing site `comecaai.com.br` root.
- Cloudflare DNS migration de GoDaddy.
- Railway wildcard `*.comecaai.com.br`.
- Bucked Up CNAME `herd.buckedup.com` (3 DNS records).

### Tier 3 (pós-Fase 4)

- NetworkProfile → User rename + ProfileStatus → UserStatus.
- OAuth providers (Google, GitHub).
- Granular permission table (RolePermission).
- Custom roles per-org.
- Approval flows, GDPR/LGPD compliance.
- SSO/SAML, MFA.
- API keys per-org.
- Drop `NetworkProfile.email @unique`.
- Railway → Vercel migration consideration (Cloudflare descartado).
- Audit log archiving > 1 year.
- Network-map feature decision.
- Edge KV / Redis cache pra org-resolver (V1 in-memory).
- JWT memberRole caching (V1 per-request lookup).
- Auto-update `allowedDevOrigins` via env var.
- Race condition em invitation dedup (sem unique constraint DB).
- `mockSentEmails` não persiste fora do server process.
- CI workflows `paths:` filter removido — trade-off CI minutes elevado (aceitável projeto solo).

---

## 6. DEV environment

### Orgs

- ComeçaAI: subdomain `app`, 7 departments.
- Bucked Up: subdomain `buckedup`, 0 departments.

### Owner

Nick (`nick@comecaai.com.br`), isSuperAdmin=true, owner ambas orgs.

### URLs

- `http://lvh.me:3000` — apex login.
- `http://app.lvh.me:3000` — ComeçaAI.
- `http://buckedup.lvh.me:3000` — Bucked Up.

### ENV críticos

- `COOKIE_DOMAIN=.lvh.me`
- `APEX_HOST=lvh.me`
- `NEXTAUTH_URL=http://lvh.me:3000`
- `NEXTAUTH_SECRET=<secret>`
- `RUNTIME_DATABASE_URL=<Supabase pooler>`

### Smoke pre-flight

```bash
cd /Users/nickmoreira/Desktop/Projects/HERD/.claude/worktrees/<current-sub-etapa>
ls -la .env  # Symlink absoluto pro main
ps aux | grep "next dev" | grep -v grep  # kill se houver
rm -rf .next/
npm run dev
```

---

## 7. Lições cravadas (skill `chat-code-handoff` v0.2.4)

Codificadas em `.agents/skills/chat-code-handoff/SKILL.md`. Resumo:

- **Worktrees (W1-W3):** `npm install` real (sem symlink), `.env` symlink absoluto, `allowedDevOrigins` pra hostnames não-localhost.
- **Next.js 16 (N1-N3):** `signIn redirect: false` pattern; cross-origin nav via `window.location.href` em useEffect; **N3 (Sub-24): server action que retorna `{redirect}` corre risco de RSC-revalidation race desmontar o form — renderizar componente client dedicado pro status terminal.**
- **Smoke (S1-S2):** smoke pega bugs que testes não pegam; DEV antes de Railway.
- **Browser (B1):** Chrome PSL + lvh.me workaround.
- **Process (P1-P4):** allowedDevOrigins preventivo, proxy smoke gate, PopoverTrigger asChild, Auth.js mock typing.

### Lição P5 (Sub-etapa 24)

Pressure verbal de Nick durante execução não substitui pause-and-report pra mudanças arquiteturais. Aconteceu em Sub-etapa 24 com workflow files. Padrão correto: diagnostica → relata → autoriza → executa. Reforçado durante o diagnóstico A1: três SPECs read-only antes de qualquer mutação, pause-and-report obrigatório (Tarefa 0 confirmando `redirect()` cross-subdomain) antes de aplicar a fix.

---

## 8. Pré-cutover Sub-etapa 28.5

Pendências do Nick (não-código):

- Cloudflare account + DNS migration de GoDaddy.
- Resend account + `comecaai.com.br` domain verification.
- Railway wildcard `*.comecaai.com.br`.
- Bucked Up DNS team coordination (CNAME `herd.buckedup.com`).

---

## 9. Onde está cada coisa importante

- **Schema:** `prisma/schema.prisma`.
- **Migrations:** `prisma/migrations/`.
- **Proxy:** `src/proxy.ts`.
- **RBAC:** `src/lib/permissions/require-org-role.ts`, `src/lib/permissions/can.ts`.
- **Auth config:** `src/lib/auth/config.ts`.
- **Tenant resolver:** `src/lib/tenant/org-resolver.ts`.
- **RLS context:** `src/lib/tenancy/context.ts`.
- **Email infra (Sub-etapa 24):** `src/lib/email/`.
- **Invitation service (Sub-etapa 24):** `src/lib/invitations/`.
- **Audit helper (Sub-etapa 25):** `src/lib/audit/write-audit-log.ts`.
- **Audit migration (Sub-etapa 25):** `prisma/migrations/20260529000000_sub_25_audit_log/`.
- **Audit handbook (Sub-etapa 25):** `docs/handbook/tools/infrastructure/audit-log/`.
- **Members UI (Sub-etapa 24):** `src/app/admin/organization/members/`.
- **Accept page (Sub-etapa 24):** `src/app/accept/[token]/`.
- **Skill chat-code-handoff:** `.agents/skills/chat-code-handoff/SKILL.md`.
- **Org admin URL helper (Sub-etapa 24):** `src/lib/tenant/org-url.ts`.
- **Accept redirect component (Sub-etapa 24):** `src/app/accept/[token]/accepted-redirect.tsx`.
- **Architect state (este arquivo):** `docs/architect-state/STATE.md`.

---

## 10. Como atualizar este arquivo

Ao final de cada sub-etapa Fase 4 (pós-merge):

1. Bump versão no topo.
2. Atualiza tabela seção 2 (status, merge hash, archive tag).
3. Move pendência ativa pra próxima sub-etapa (seção 3).
4. Adiciona decisões arquiteturais novas (seção 4) se houverem.
5. Atualiza tech debt (seção 5) — move resolvidos pra "done" inline ou remove.
6. Adiciona lições novas (seção 7) — referencia skill update.
7. Commit em sub-etapa separada OU como último commit da sub-etapa atual.

Comando:

```bash
# Após merge sub-etapa N
git checkout main
git pull origin main
# Edita docs/architect-state/STATE.md
git add docs/architect-state/STATE.md
git commit -m "docs(state): update post-sub-etapa-<N>"
git push origin main
```

---

## 11. Como iniciar nova sessão chat-architect

Primeiro turno na nova sessão Claude.ai:

```
Estou abrindo uma nova sessão. Leia o arquivo docs/architect-state/STATE.md
do repo HERD pra contexto cravamento. Tenha em mãos também HANDOFF.md
da sessão anterior se precisar de mais detalhe operacional.

Estado atual: <descreva 1 linha o que está pendente>.

Próximo passo proposto: <descreva>.
```

A nova sessão deve:
1. Confirmar entendimento em 2-3 sentenças.
2. Validar premissas (sub-etapa pendente, gates, smoke status).
3. Propor ação concreta.

---

## 12. Cravamento

Este arquivo é o estado canônico. Tudo o que diverge dele deve ser confrontado com evidência empírica (commits, gates, smoke). Sem reescrever história sem causa.

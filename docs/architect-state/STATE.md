# Architect State — ComeçaAI Fase 4

> **Propósito:** Este arquivo é o estado canônico cross-session do trabalho de chat-architect em curso. Atualizado ao final de cada sub-etapa Fase 4. Qualquer nova sessão Claude.ai (chat-architect) deve ler este arquivo PRIMEIRO antes de propor qualquer trabalho.
>
> **Versão:** v1.0 (criado 2026-05-28, pós-Sub-etapa 24 commit `fa33d45`)
>
> **Próxima atualização esperada:** pós-merge Sub-etapa 24.

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
| 14 | **24 — Invitation flow + EmailProvider mock** | 🟡 PR #77 ready, smoke pendente | — (`fa33d45` em branch) | — |
| 15 | 25 — Audit log | ⏭️ pending | — | — |
| 16 | 26 — Sub-org hierarchy | ⏭️ pending | — | — |
| 17 | 27 — UI consolidation | ⏭️ pending | — | — |
| 18 | 28 — Smoke harness DEV | ⏭️ pending | — | — |
| 19 | 28.5 — Domain cutover + Resend + Bucked Up PROD | ⏭️ pending | — | — |

**Progresso:** 13/17 cravadas (76%).

---

## 3. Pendência ativa

### Sub-etapa 24 (Invitation flow) — aguardando smoke DEV

- **PR:** https://github.com/nickmoreira23/herd/pull/77 (Draft)
- **Branch:** `feat/sub-24-invitation-flow`
- **Worktree:** `.claude/worktrees/sub-24-invitation-flow/`
- **Top commit:** `fa33d45` — fix(sub-24): adapt user-table.tsx to invitation flow

**Gates (verdes):**
- tsc 0 errors
- lint 0 errors (350 warnings pre-existentes)
- test 480/480 pass (41 novos)
- build ✓ (warnings DB pool + NEXT_PRERENDER_INTERRUPTED são pre-existentes, não blockers)
- CI 4/4 required (Cloudflare Workers fail é pre-existente, não required)

**Gate manual pendente:** Smoke DEV 5 cenários. Detalhe completo no `HANDOFF.md` da sessão arquitetural.

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

### Schema crítico

- `Organization`: 17 cols, sem `ownerId` (drop 20.1), `subdomain UNIQUE`, `customDomain UNIQUE nullable`.
- `OrganizationMember`: relation name `organizationMemberships`.
- `MemberRole` enum: OWNER, ADMIN, MEMBER, DEPARTMENT_HEAD, DEPARTMENT_MANAGER, DEPARTMENT_MEMBER.
- `MembershipStatus`: ACTIVE, SUSPENDED, INVITED (NÃO USADO), REMOVED.
- `InvitationStatus`: PENDING, ACCEPTED, DECLINED, EXPIRED (sem REVOKED).
- `NetworkProfile.isSuperAdmin Boolean`. Nick = true.

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

## 7. Lições cravadas (skill `chat-code-handoff` v0.2.3)

Codificadas em `.claude/skills/chat-code-handoff/SKILL.md`. Resumo:

- **Worktrees (W1-W3):** `npm install` real (sem symlink), `.env` symlink absoluto, `allowedDevOrigins` pra hostnames não-localhost.
- **Next.js 16 (N1-N2):** `signIn redirect: false` pattern, cross-origin nav via `window.location.href` em useEffect.
- **Smoke (S1-S2):** smoke pega bugs que testes não pegam; DEV antes de Railway.
- **Browser (B1):** Chrome PSL + lvh.me workaround.
- **Process (P1-P4):** allowedDevOrigins preventivo, proxy smoke gate, PopoverTrigger asChild, Auth.js mock typing.

### Lição P5 pendente (Sub-etapa 24)

Pressure verbal de Nick durante execução não substitui pause-and-report pra mudanças arquiteturais. Aconteceu em Sub-etapa 24 com workflow files. Padrão correto: diagnostica → relata → autoriza → executa.

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
- **Email infra (Sub-etapa 24):** `src/lib/email/` (após merge).
- **Invitation service (Sub-etapa 24):** `src/lib/invitations/` (após merge).
- **Members UI (Sub-etapa 24):** `src/app/admin/organization/members/` (após merge).
- **Accept page (Sub-etapa 24):** `src/app/accept/[token]/` (após merge).
- **Skill chat-code-handoff:** `.claude/skills/chat-code-handoff/SKILL.md`.
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

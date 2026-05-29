---
name: chat-code-handoff
scope: project-local
overrides: anthropic-skills:chat-code-handoff
version: 0.2.4
---

# chat-code-handoff (ComeçaAI project-local addendum)

> **Project-local override** da skill global `anthropic-skills:chat-code-handoff`.
> Adiciona regras ComeçaAI-específicas estabelecidas empiricamente durante Fase 0 + Camada 1 + Fase 3.
>
> A skill global continua sendo a referência principal para o protocolo geral.
> Este documento adiciona uma regra cravada que tem precedência sobre orientações
> genéricas da global.

---

## Regra cravada — Discovery antecipada é obrigatória antes de toda spec

**Princípio:** O chat (Claude.ai) NUNCA escreve spec executável de uma sub-etapa
sem primeiro pedir ao Claude Code uma discovery read-only do estado atual.

**Razão:** Empiricamente observado em Sub-etapas 4, 5, 6, 8, 8.5, 9, 10 da Camada 1
e Sub-etapas 3.1-3.4 da Fase 3: toda sub-etapa que pulou discovery antecipada
revelou pelo menos uma surpresa que exigiu pause-and-report mid-execution.
Sub-etapas com discovery antecipada fecharam limpo na primeira tentativa.

**Custo da discovery:** 5-15 minutos de Claude Code read-only.
**Custo de pular:** 1+ pause-and-report mid-execution, retrabalho da spec,
contexto fragmentado no chat.

---

## Fluxo padrão (cravado)

1. **Sub-etapa anterior fecha** com relato detalhado.
2. **Chat solicita discovery antecipada** ao Claude Code (read-only, sem mudança de código).
3. **Claude Code executa discovery + reporta** em formato estruturado.
4. **Chat escreve spec executável** com base no estado real revelado pela discovery.
5. **Chat passa spec ao usuário.** Usuário passa para Claude Code.
6. **Claude Code executa + reporta.**
7. **Sub-etapa fecha.** Volta ao passo 1.

---

## Exceções permitidas (raras)

A discovery antecipada pode ser pulada APENAS em:

- **Sub-etapa puramente mecânica e isolada** sem possibilidade de surpresa
  (ex: rename trivial de variável em arquivo único, atualização de número
  de versão). Mesmo nesses casos, o custo de fazer discovery é baixo —
  recomendado fazer.
- **Continuação imediata de sub-etapa pausada** em que o estado é conhecido
  linha a linha do contexto recente.

Quando em dúvida: fazer discovery. Custo de fazer > não fazer só quando
a discovery for absolutamente trivial.

---

## O que conta como discovery antecipada

Discovery dedicada, com objetivo de mapear o estado atual ANTES da spec existir.
Saída esperada: relato estruturado que o chat consome para escrever a spec precisa.

**Cobertura típica:**

- **Schema:** shape de tabelas atuais, FKs entrantes, counts de DEV.
- **Código:** todos os consumers do escopo (greps por imports + referências).
- **Comportamento:** padrões em uso (helpers existentes, convenções, wrappers).
- **Sample data:** counts reais para confirmar premissas de "vazio" ou "tem volume".
- **Dependências externas:** env vars, credenciais, integrações de terceiros.

---

## O que NÃO é discovery antecipada

- ❌ "Eu já tenho contexto suficiente" — estado do código muda entre sub-etapas.
- ❌ "Vou pular porque é rápido" — sub-etapas que parecem rápidas são as
  que mais sofrem surpresa.
- ❌ Tarefa 0 (pre-flight) embutida na spec — esse é o pre-flight da execução,
  não a discovery que informou a spec.

---

## Sinais de discovery bem feita

- ✅ Relato revela ≥1 detalhe que muda como a spec será escrita
  (nome real de tabela, contagem real de consumers, decisão pendente).
- ✅ Spec resultante tem números concretos, não estimativas vagas.
- ✅ Pause-and-report durante execução cai significativamente (idealmente: zero).

## Sinais de discovery insuficiente

- ❌ Discovery não revelou nada novo (provavelmente foi superficial).
- ❌ Spec usa expressões como "esperado", "provavelmente", "aproximadamente"
  para números que poderiam ser exatos.
- ❌ Primeiro pause-and-report da execução é sobre algo que a discovery teria visto.

---

## Exemplo concreto: Sub-etapa 3.4 (Commission + D2D cleanup)

Sub-etapa parecia simples: "delete tudo Commission/D2D".
Spec inicial estimou ~26 rotas a deletar.

**Discovery antecipada revelou:**

1. **16 rotas, não 26.** 8 já estavam fora do escopo desde sub-etapas anteriores.
   Spec final tinha contagem precisa.

2. **29 components em `src/components/network/`**, dos quais 1 (`wizard-progress.tsx`)
   tinha 3 consumers fora-MLM (marketplace, routines, packages wizards).
   Precisava ser preservado e movido para `src/components/shared/`.
   Sem discovery, esse arquivo teria sido deletado e quebrado 3 wizards não-MLM.

3. **2 páginas admin de pagamentos** (`/admin/operation/finances/payments` +
   `/admin/tools/payments`) não estavam no plano original mas dependiam de
   `ledger-tab.tsx`. Discovery as identificou; spec incluiu na lista de delete.

4. **`/admin/partners/` é UI duplicada legacy** de `/admin/blocks/partners/`.
   Uma é deletada (legacy), outra fica (canonical, vai virar Perk).
   Sem discovery, essa distinção seria perdida.

**Resultado:** Sub-etapa 3.4 fechou em 1 PR (79 files / 9451 deletions),
zero pause-and-report. Sem discovery antecipada, esses 4 pontos teriam virado
4 pause-and-reports e múltiplos round-trips.

---

## Operacional: como o chat pede discovery antecipada

Formato típico:

```
Discovery antecipada — Sub-etapa X.Y (read-only, ~N min)
Não criar nada, não modificar nada. Só reportar.
[blocos de comando bash com greps, queries DB, etc.]
Relato esperado:
[template estruturado do que o chat espera receber]
```

Discovery NUNCA muda código. Discovery NUNCA cria branch ou worktree.
Discovery NUNCA roda migrations. É 100% read-only.

---

## Histórico empírico

Cravado nesta skill após observação direta em:

- Camada 1, Sub-etapa 4: GUC ausente descoberto em discovery — economizou
  pause-and-report.
- Camada 1, Sub-etapa 5: 4º handler (Recall) descoberto em discovery — spec inicial
  só previa 3.
- Camada 1, Sub-etapa 6: shape real do outbox `domain_events` descoberto em discovery —
  spec inicial assumia shape diferente.
- Camada 1, Sub-etapa 9: nomenclatura `Organization` vs `organizations` revelada
  em pre-flight (deveria ter sido discovery dedicada).
- Camada 1, Sub-etapa 10: pré-condição faltante (RECHARGE_CLIENT_ID) revelada em
  discovery, bloqueando antes de qualquer código.
- Fase 3, Sub-etapas 3.1-3.4: discovery exaustiva fez 3 sub-etapas fecharem
  na primeira tentativa.

---

## Lições cravadas pós-criação (v0.2.0 — Fase 3)

Lições acumuladas durante a execução de Fase 3 (Sub-etapas 3.5 → 3.8),
cravadas após pause-and-reports ou perdas de tempo identificadas em retrospect.

### L1 — Discovery cobre reverse rels em TODOS preserved models

Para sub-etapas de DROP migration, discovery não pode mapear reverse rels
apenas no model principal preservado. Precisa mapear em todos os preserved
models que tocam o cluster alvo.

**Como aplicar:** para cada model preservado que pode ter reverse rel para
o alvo, rodar `grep -A 100 "^model PreservedX" prisma/schema.prisma | grep "<TargetType>\[\]"`.

**Caso real (3.6):** discovery inicial não mapeou reverse rels de
`SubscriptionTier` e `RankTier` para `CommissionTierRate` / `MonthlyPerformance`
— `prisma validate` pegou durante execução, exigiu Edit adicional.

### L2 — Code consumers via `prisma.X` literals, não só nomes de model

`grep \bModelName\b` não pega consumers que usam `prisma.modelName.findMany`,
`include: { modelName }`, ou destructuring de relations.

**Como aplicar:** após edição preliminar do schema, rodar `npx prisma generate`
em um branch/worktree temporário e ler os tsc errors. A surface de errors é
o cluster real de consumers a tratar.

**Caso real (3.6):** Tarefa 0.5 (worktree throwaway + tsc surface check) na
discovery antecipada da 3.6 revelou 20 files reais vs 13 estimados pela spec.
Sem essa Tarefa 0.5, sub-etapa teria pausado mid-flight.

### L3 — Para renames de model, sempre `grep "^model NewName"` antes

Antes de assumir que rename de model é mecânico, confirmar que o nome alvo
não existe como model independente. Caso contrário, o "rename" é decisão
de produto (merge, drop, ou rename para outro nome) — não operação mecânica.

**Caso real (3.5.5):** spec inicial assumia rename `PartnerBrand → Perk` como
mecânico. Discovery 3.5.5 revelou: `Perk` já existia como model paralelo com
stack completo (zero rows, 11 consumer files). Spec foi totalmente reescrita
após pause-and-report (drop PartnerBrand inteiro). Sem essa verificação prévia,
teria sido bloqueio destrutivo.

### L4 — `npm run build` local em worktree é expected failure

Turbopack rejeita symlinks cross-worktree de `node_modules`. Build local
em worktree falha mesmo com código correto.

**Como aplicar:** validar build via CI, não local. Outros gates (tsc, lint,
tests) rodam normalmente no worktree (com node_modules symlinkado — ver L5).
Aceitar falha de `npm run build` no worktree como conhecida.

**Caso real (3.7, 3.8):** ambas as sub-etapas tentaram build local, falharam
no symlink; CI validou green. Procedimento cravado: pular build local.

### L5 — Pre-commit hook em worktree precisa de symlink de node_modules

Para que `lint && typecheck && test` rodem no pre-commit hook dentro de um
worktree (`node_modules` é um diretório com tooling, não checkado-in), criar
symlink temporário para o `node_modules` do main repo. Remover antes do push.

**Como aplicar:**

```bash
cd .claude/worktrees/<branch>/
ln -sfn /<abs-path-main-repo>/node_modules node_modules
# ... rodar gates / fazer commits ...
rm node_modules
git push
```

**Caso real (3.7, 3.8):** pre-commit hook quebrou silenciosamente sem o
symlink. Workaround documentado e replicado nas duas sub-etapas.

### L6 — Scripts CLI standalone precisam `dotenv/config` explícito

`tsx` (e Node direto via `node`) NÃO carrega `.env` automaticamente.
Apenas frameworks como `next dev` fazem isso. Scripts standalone executados
via `npx tsx scripts/X.ts` ou `npm run X` que dependam de env vars precisam
de `import "dotenv/config"` como primeira linha.

**Como aplicar:** todo script novo em `scripts/` ou `prisma/seeds/` que
toca `process.env.X` deve ter `import "dotenv/config"` como primeira linha.
Seguir padrão de `prisma/seeds/seed-ledger.ts`.

**Sintoma:** script falha com `process.env.X is undefined` mesmo com X
presente no `.env`. Erro confunde porque `next dev` funciona, e o
desenvolvedor assume que `.env` é "automágico".

**Caso real (10.0.1):** Sub-etapa 10 entregou `scripts/seed-recharge-integration.ts`
sem essa linha. Bloqueou execução pós-merge. Hotfix Sub-etapa 10.0.1 cravou.

### L7 — `npm run build` local obrigatório para sub-etapas tocando route handlers ou next.config

CI atual no GitHub roda `tsc + lint + tests` mas **NÃO roda `npm run build`**
(Next.js full compilation). Sub-etapas que introduzem route handlers, server
actions, ou modificam `next.config.ts` podem passar todos os gates de CI
e ainda falhar em produção (Railway/Vercel build).

**Como aplicar:** spec deve incluir `npm run build` como gate local
obrigatório nas Tarefas, junto com tsc/lint/test, quando:

- Cria/modifica arquivo em `src/app/**/route.ts`
- Cria/modifica server actions
- Modifica `next.config.ts`
- Mudança suspeita de afetar Next.js compile (RSC, streaming, cache)

**Onde rodar:** `npm run build` em worktree falha por Turbopack rejeitar
symlink cross-worktree de `node_modules` (L4). Rodar no main repo com fix
temporariamente copiado, depois `git checkout` para reverter. Cost: ~2 min,
worth it.

**Caso real (12.0.1):** Sub-etapa 12 introduziu 2 route handlers com
`export const dynamic = "force-dynamic"`. CI passou (tsc + lint + test ✓).
Railway build falhou com `"dynamic" is not compatible with nextConfig.cacheComponents`.
Hotfix Sub-etapa 12.0.1 removeu as duas linhas.

**Bonus context:** Next.js 16 com `cacheComponents: true` (Cache Components)
torna route handlers auto-dinâmicos por inferência quando lêem env/DB.
`force-dynamic` é redundante + incompatível.

---

## Armadilhas operacionais cravadas

Lições acumuladas durante Fase 4 (Sub-etapas 22 V2 → 22.2), codificadas após
smoke failures, lint blocks, e surpresas de ambiente que custaram round-trips.

### Worktree hygiene

**W1 — `npm install` real em worktree, não symlink de node_modules**

Turbopack 16 rejeita symlinks cross-filesystem entre worktrees. Worktrees que
introduzem dependências novas (ou que dependem do lockfile atualizado) precisam
de `npm install` real dentro do worktree. L5 (symlink para pre-commit hook) ainda
se aplica para gates, mas **não** para o runtime do servidor de desenvolvimento.

**Caso real (22 V2):** worktree com symlink de `node_modules` fez Turbopack
rejeitar imports silenciosamente. Fix foi `npm install` real no worktree.

**W2 — `allowedDevOrigins` obrigatório para DEV hostnames não-localhost**

Next.js 16 bloqueia cross-origin HMR e Server Action requests quando o hostname
não é `localhost`. Qualquer worktree ou ambiente DEV usando domínios customizados
(ex: `lvh.me`, `*.lvh.me`) precisa de:

```typescript
// next.config.ts — DEV only
...(process.env.NODE_ENV === "development" && {
  allowedDevOrigins: ["lvh.me", "app.lvh.me", "buckedup.lvh.me"],
}),
```

Sem isso, Server Actions falham silenciosamente com "Failed to find Server Action"
e o client fica preso em estado de loading ("Signing in...").

**Caso real (22.2 smoke):** Cenário 1 ficou em loop "Signing in..." por falta
de `allowedDevOrigins`. Fix + clear `.next/` resolveu.

**W3 — Após add `allowedDevOrigins`, limpar `.next/` antes de re-testar**

`allowedDevOrigins` afeta a compilação do bundle de dev. Sem clear do cache,
o servidor pode continuar servindo o bundle antigo sem a configuração nova,
mascarando o fix.

```bash
rm -rf .next && npm run dev
```

### Next.js 16 quirks

**N1 — `redirect: false` em Auth.js v5 para login com roteamento pós-auth customizado**

`signIn("credentials", { ..., redirect: true })` (default) lança `NEXT_REDIRECT`
internamente, impedindo qualquer lógica pós-login. Para custom routing (apex →
subdomain, multi-org → /orgs), usar `redirect: false` e retornar `{ redirect: url }`
da action. Client side: `useEffect` watching `state.redirect` → `window.location.href`.

```typescript
await signIn("credentials", { email, password, redirect: false });
// pós-login: query memberships → decidir URL
return { redirect: targetUrl };
```

**N2 — Navegação cross-origin via `window.location.href` + `useEffect`, não router**

`router.push()` e `router.replace()` não funcionam cross-origin (ex: `app.lvh.me` →
`buckedup.lvh.me`). Pattern canônico: `redirectUrl` state + `useEffect`:

```typescript
const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
useEffect(() => {
  if (redirectUrl) { window.location.href = redirectUrl; }
}, [redirectUrl]);

// no handler:
setRedirectUrl(body.data.redirectUrl);
```

A atribuição direta `window.location.href = url` dentro de função async
dispara `react-hooks/immutability` lint error. O pattern state+effect evita isso.

**Caso real (22.2 org-list.tsx):** lint bloqueou CI com `react-hooks/immutability`.
Fix foi extrair para `redirectUrl` state + `useEffect`.

**N3 — Server action que retorna `{redirect}` corre risco de RSC-revalidation race**

Uma server action invocada via `<form action={formAction}>` dispara revalidação/
re-render automático do RSC da rota atual após completar. Se esse re-render
desmontar o componente do form ANTES do `useEffect(window.location.href =
state.redirect)` disparar, o usuário fica preso na página — o redirect client-side
nunca executa.

O sintoma é traiçoeiro: backend completa 100% (mutation OK, signIn OK, POST 200),
`isPending` mostra o texto de loading, mas o browser não navega. A página re-renderiza
para o branch terminal (ex: status `ACCEPTED`) que desmonta o form.

**Como aplicar:** para o status terminal pós-action, renderizar um componente
client dedicado cujo único trabalho é re-emitir a navegação no mount:

```tsx
// page.tsx (RSC) — branch terminal ANTES dos branches genéricos
if (data.invitation.status === "ACCEPTED") {
  return <AcceptedRedirect redirectUrl={buildOrgAdminUrl(sub)} orgName={name} />;
}

// accepted-redirect.tsx (client)
useEffect(() => { window.location.href = redirectUrl; }, [redirectUrl]);
```

Assim a navegação é re-emitida independente de qual caminho vença a corrida
(form `useEffect` ou re-render do RSC). O happy-path redirect do form fica intacto.

**Por que não `redirect()` server-side:** Next `redirect()` não cruza subdomínios
de forma confiável sob Turbopack (mesma razão da N2). A URL cross-subdomain
(`<sub>.<apex>/admin`) é construída por helper único (`buildOrgAdminUrl`) consumido
por action + page, eliminando drift de subdomínio entre os dois caminhos.

**Caso real (Sub-etapa 24, A1):** "Create account and accept" deixava o botão preso
em "Creating account..." e o usuário em `/accept` mostrando "already accepted".
Backend confirmado 100% via DB; causa era o re-render do RSC desmontando `AcceptForm`
antes do seu `useEffect` redirecionar. Fix: `<AcceptedRedirect>` + `buildOrgAdminUrl`
(PR #85, merge `9149412`).

### Smoke vs testes automatizados

**S1 — Smoke manual revela chain de redirects que testes unitários não pegam**

Testes unitários mockam módulos e não exercitam o pipeline real de proxy →
Next.js → browser. Chains de redirect (ex: proxy → `/` → `redirect("/admin")` →
proxy → `/login` sem query string) são invisíveis para testes e só aparecem em
smoke manual end-to-end.

**Caso real (22.2 Cenário 3):** `?error=org_not_found` desaparecia porque a chain
era `proxy → "/"` → `redirect("/admin")` → proxy → `/login` (sem querystring).
Testes de unidade do proxy passavam porque não executavam a chain completa.
Fix: proxy redireciona para `/login` diretamente, não para `/`.

**S2 — Smoke sequence: DEV first, depois Railway; não inverter**

Bugs de ambiente DEV (ex: missing `allowedDevOrigins`, `.next/` cache stale)
devem ser resolvidos antes do smoke Railway. Invertido, pode-se concluir
erroneamente que o bug é de produção quando é de DEV.

### Browser/cookie traps

**B1 — `Domain=.localhost` silently blocked by Chrome (PSL)**

Chrome trata `localhost` como public suffix (Public Suffix List). Cookies com
`Domain=.localhost` são silenciosamente descartados — sem erro, sem warning no
DevTools. Usar `lvh.me` como TLD DEV: `*.lvh.me → 127.0.0.1` via DNS público,
TLD real (`.me`) aceito por todos os browsers.

```
# .env DEV
COOKIE_DOMAIN=.lvh.me
APEX_HOST=lvh.me
NEXTAUTH_URL=http://lvh.me:3000
```

Internet connection obrigatória em DEV para resolução DNS. Offline workaround:
`/etc/hosts` custom TLD (rastreado como tech debt).

### Disciplina de processo

**P1 — Spec inclui `allowedDevOrigins` quando worktree usa DEV hostname não-localhost**

Qualquer sub-etapa que introduz novo hostname DEV (customDomain, subdomain, etc.)
deve incluir na spec o item de `allowedDevOrigins`. Sem isso, o primeiro smoke
vai falhar com sintoma opaco ("Server Action not found").

**P2 — Proxy patches (redirect target, matcher) exigem smoke manual, não só tsc**

Mudanças em `proxy.ts` afetam o pipeline completo de request. `tsc + lint + test`
não cobrem chains de redirect. Spec deve incluir smoke manual como gate obrigatório
para qualquer alteração em `proxy.ts`.

**P3 — `PopoverTrigger asChild` não suportado nesta versão da UI library**

`<PopoverTrigger asChild>` em `src/components/ui/popover.tsx` desta codebase
não expõe a prop `asChild`. Usar `<PopoverTrigger className="...">` diretamente,
sem `asChild`, e mover estilos para o trigger wrapper.

```typescript
// errado:
<PopoverTrigger asChild>
  <button>...</button>
</PopoverTrigger>

// correto:
<PopoverTrigger className="flex items-center gap-2 ...">
  conteúdo inline
</PopoverTrigger>
```

**P4 — Auth.js v5 mock typing: `mockResolvedValue(null as never)`**

`auth()` em Auth.js v5 tem tipo overloaded. `mockResolvedValue(null)` em Jest
falha com `Argument of type 'null' is not assignable to parameter of type
'NextMiddleware'`. Fix: `mockResolvedValue(null as never)`.

---

## Referência

- Skill global: `anthropic-skills:chat-code-handoff` (protocolo geral)
- Practice-housekeeping-git: padrões git ComeçaAI-específicos para sub-etapas
- AGENTS.md: contexto operacional do projeto

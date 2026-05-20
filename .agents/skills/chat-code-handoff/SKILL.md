---
name: chat-code-handoff
scope: project-local
overrides: anthropic-skills:chat-code-handoff
version: 0.1.0
---

# chat-code-handoff (HERD project-local addendum)

> **Project-local override** da skill global `anthropic-skills:chat-code-handoff`.
> Adiciona regras HERD-específicas estabelecidas empiricamente durante Fase 0 + Camada 1 + Fase 3.
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

## Referência

- Skill global: `anthropic-skills:chat-code-handoff` (protocolo geral)
- Practice-housekeeping-git: padrões git HERD-específicos para sub-etapas
- AGENTS.md: contexto operacional do projeto

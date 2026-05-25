---
title: "Pattern: Snapshots"
description: "Fotos congeladas de estado com período configurável; distinção entre progress, balances, positions e snapshots."
locale: pt-BR
uid: herd.meta.pattern-snapshots
---

> Para agentes de IA: este pattern é invariante de schema. Quando criar block de estado, decidir conscientemente qual sufixo usar (`-progress`, `-balances`, `-positions`, `-snapshots`) — cada um tem semântica precisa. Período de snapshots é sempre configurável; nunca hardcodar mensal. Decisões cravadas em sessão arquitetural de maio/2026.

# Pattern: Snapshots

Snapshots são **fotos congeladas de estado em ponto no tempo**, capturando todos os campos relevantes de um agregado dentro de um período definido. O insight crítico é simples mas costuma escapar: **período NÃO é fixo em mensal**. Empresas têm campanhas quinzenais, fechamentos quinzenais, rankings trimestrais, snapshots anuais para fim de ano fiscal — o sistema acomoda essa flexibilidade via campo `period` configurável.

Snapshots fazem parte de uma família maior de blocks de estado, cada um com sufixo canônico que codifica semântica precisa: `-progress`, `-balances`, `-positions`, `-snapshots`. Confundir os quatro produz schemas que parecem ok mas falham quando o produto cresce.

## Business

Empresas operam em ritmos diferentes. Uma campanha de ranking pode durar 15 dias; o fechamento financeiro pode ser quinzenal; o reconhecimento de revendedor pode ser trimestral; o relatório de pontos para fim de ano fiscal é anual. Hardcodar "snapshots mensais" no schema significaria reescrever tabelas a cada cliente que pede período diferente.

A consequência prática é que toda lógica de "fechar período e congelar estado" precisa carregar o período como dado, não como suposição. Isso permite:

- **Rankings com período custom** sem código novo (campanha especial de 30 dias).
- **Relatórios financeiros multimoda** (visão mensal + visão trimestral + visão anual sobre o mesmo histórico).
- **Comparações ano-a-ano** confiáveis porque cada snapshot carrega seus delimitadores temporais.

## Product

### O que profile vê

Profile abre histórico (de Points, Remuneration, Ranking position) e o seletor de período mostra opções: mensal, quinzenal, trimestral, anual, ou range custom. Cada opção lista os snapshots correspondentes. Não é "uma página por mês" — é uma única vista que muda de período conforme escolha.

### Examples canônicos

- **Ranking de campanha quinzenal**: campanha "Promoters de Verão" dura 15 dias. Snapshot ao fim do período congela posições. `period.type: "biweekly"` com `start_date` e `end_date` do exato range.
- **Remuneration mensal padrão**: fechamento financeiro mensal — `period.type: "monthly"`. Snapshot capturado no último dia do mês contendo balance por moeda, deduções, payout final.
- **Points snapshot anual** para fim de ano fiscal: `period.type: "yearly"`. Captura saldo total de pontos, redemptions do ano, balance projetado.
- **Ranking de evento especial** (ex: Black Friday 30 dias): `period.type: "custom"` com start_date e end_date explicitamente delimitados.

## Architecture

### Schema canônico de snapshot

```typescript
snapshot {
  id, profile_id,
  period: {
    type: "monthly" | "weekly" | "biweekly" | "quarterly" | "yearly" | "custom",
    start_date, end_date,
  },
  values: { ... },                           // estado completo congelado
  created_at,
}
```

Três regras invioláveis:

1. **`period` sempre presente**: nunca derive período do nome do block ou de constante de código.
2. **`values` captura estado completo**: snapshot é foto, não delta. Inclua todos os campos relevantes para reconstrução do estado naquele ponto.
3. **Snapshot nunca muda após criação**: append-only. Correção é via novo snapshot ou via compensating entries em `-events` (ver `pattern-source-attribution`).

### Distinção entre tipos de blocks de estado

Vocabulário comum confunde "estado atual" com "histórico". O ComeçaAI distingue quatro tipos formais — cada um com sufixo próprio:

| Sufixo | Função | Período? |
|---|---|---|
| `-progress` | Current state contínuo (level atual + histórico de progressão no track) | NÃO |
| `-balances` | Current saldo dinâmico (atualiza on event) | NÃO |
| `-positions` | Ranking current + histórico congelado por período | SIM (configurável) |
| `-snapshots` | Histórico congelado genérico por período configurável | SIM (configurável) |

Critério decisivo:

- **Estado atual sem dimensão temporal de fechamento?** → `-progress` (level/track) ou `-balances` (valor numérico).
- **Estado com histórico de períodos fechados?** → `-positions` (Ranking-specific, mais semântica) ou `-snapshots` (genérico).
- **Eventos individuais que somam para chegar ao estado?** → permanecem em `-events` (ver `pattern-block-level`); `-balances` e `-snapshots` são projeções derivadas.

### Cross-tool snapshot semantics

Cada tool de progression usa o sufixo apropriado:

| Tool | Block(s) de estado | Lógica |
|---|---|---|
| Recognition | `recognition-progress` | Current level + histórico de progressão (sem período) |
| Capacitation | `capacitation-progress` | Current state de cursos completados (sem período) |
| Ranking | `ranking-positions` | Current rank + posições congeladas por período |
| Remuneration | `remuneration-balances` + `remuneration-snapshots` | Saldo dinâmico + histórico periódico congelado |
| Points | `points-balances` + `points-snapshots` | Saldo dinâmico + histórico periódico congelado |

Padrão recorrente: tools que envolvem **dinheiro/pontuação acumulável** geralmente precisam dos dois (balance dinâmico para cálculo + snapshots para auditoria histórica). Tools de **progressão por níveis** geralmente precisam só de `-progress`.

### Geração de snapshots

Snapshots tipicamente são gerados por background job ao fim do período:

1. Cron/scheduler detecta período se fechando.
2. Job percorre profiles relevantes.
3. Para cada profile, computa estado a partir de events do período (mais source attribution para auditabilidade).
4. Persiste snapshot append-only.
5. Eventos individuais permanecem em `-events` — snapshot é projeção, não substituto.

## Operations

### Checklist para criar block de estado

1. **Decidir natureza do estado**: contínuo (sem fechamento) ou periódico (com fechamento)?
2. **Escolher sufixo apropriado**: `-progress` (level/track contínuo), `-balances` (saldo numérico contínuo), `-positions` (rank periódico — só Ranking), `-snapshots` (genérico periódico).
3. **Se periódico**: definir campo `period` com `type` enum + `start_date` + `end_date`. Sempre configurável.
4. **`values` completo**: snapshot deve permitir reconstrução do estado sem precisar reler events.
5. **Append-only**: snapshot nunca é editado depois de criado. Correção via novo snapshot ou compensating events.
6. **Source attribution paralela**: se o snapshot é derivado de events, considerar registrar `source` nos `-events` que contribuíram (cross-checkable).
7. **Background job**: planejar geração periódica via job ao fim de cada período.

### Anti-patterns a evitar

- **Hardcodar período mensal**: criar `points-monthly-snapshots` em vez de `points-snapshots` com `period.type` configurável. Quebra quando cliente pede período diferente.
- **Snapshot mutável**: editar snapshot existente quando dado original muda. Errado: snapshot é foto histórica; correção via compensating entry no block de events.
- **Snapshot como substituto de events**: descartar events depois de gerar snapshot. Errado: events permanecem como source of truth; snapshot é projeção.
- **Confundir sufixos**: usar `-history` ou `-archive` em vez dos sufixos canônicos. Quebra a tabela de semântica e dificulta agentes/tooling que confiam nos sufixos.
- **`-positions` fora de Ranking**: o sufixo `-positions` é específico para Ranking. Outras tools usam `-snapshots` para histórico periódico genérico.

## Glossary

- **snapshot**: foto congelada de estado em ponto no tempo, append-only, com período explícito.
- **progress**: current state contínuo de progressão (level atual + histórico no track), sem fechamento periódico.
- **balance**: current saldo dinâmico que atualiza on event, sem fechamento periódico.
- **position**: current rank + histórico congelado por período; específico para tool Ranking.
- **period**: janela temporal explícita do snapshot, com type enum e start_date/end_date.
- **period-configurable**: capacidade do snapshot acomodar períodos variados (mensal, quinzenal, trimestral, anual, custom).
- **current-state**: estado atual sem dimensão temporal de fechamento — dinâmico, atualiza continuamente.
- **historical-state**: estado capturado em ponto específico do tempo — imutável, append-only.

## Changelog

- **2026-05-04 (v1.0)** — Pattern cravado em sessão arquitetural R2.5 expandida (maio/2026). Estabelece distinção formal entre `-progress`, `-balances`, `-positions` e `-snapshots`. Snapshots têm período configurável (nunca hardcodado mensal). Snapshots são append-only; correção via compensating events.

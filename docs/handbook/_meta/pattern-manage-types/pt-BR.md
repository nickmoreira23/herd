---
title: "Pattern: Manage Types/Sets"
description: "Pattern UX para tools que gerenciam templates + instances no mesmo lugar via header sub-action."
locale: pt-BR
uid: herd.meta.pattern-manage-types
---

> Para agentes de IA: este pattern é invariante de UX. Quando criar tool que tenha templates reutilizáveis e instances atreladas, aplique este pattern em vez de criar tool template-only separada. Decisões cravadas em sessão arquitetural de maio/2026.

# Pattern: Manage Types/Sets

Pattern UX cravado para tools que gerenciam **templates** (definições reutilizáveis) **e instances** (entidades concretas que usam aqueles templates) no mesmo lugar. Em vez de criar uma tool separada para gerenciar templates (que polui a arquitetura com tool template-only), o pattern usa uma **header sub-action** que abre o gerenciador de templates como visão secundária da mesma tool.

## Business

A motivação é evitar fragmentação. Quando um conceito de negócio tem "tipo + instância" (plan-types vs plans, permission-sets vs permissions, profile-types vs profiles), a tentação natural é criar duas tools: uma para gerenciar tipos, outra para instâncias. O resultado é arquitetura inflada com tools template-only que duplicam chrome, dificultam navegação ("para criar um Plan Renda Pura preciso ir em Plan Types primeiro"), e fragmentam o vocabulário.

O pattern Manage Types/Sets resolve isso: **uma tool, uma listagem principal de instances, e uma sub-action no header para gerenciar templates**. O usuário entende a relação template-instância sem precisar trocar de tool. Templates e instances vivem na mesma family de blocks; UI reflete a coesão.

## Product

### Layout canônico

```
┌─────────────────────────────────────────────┐
│  Plans                  [Manage types ▾]   │
├─────────────────────────────────────────────┤
│  [+ New Plan]                               │
│  ─────────────────                          │
│  - João — Renda Principal                   │
│  - Maria — Renda Extra                      │
│  - Pedro — Renda Pura                       │
└─────────────────────────────────────────────┘
```

A header tem dois affordances:

- **Sub-action "Manage types"** (ou "Manage sets" para terminologia de sets): abre o gerenciador de templates. Lista, cria, edita, e arquiva templates. Modal, sheet, ou rota dedicada interna à tool — mas sempre acessada via header da tool principal.
- **Action principal "+ New {Instance}"**: cria nova instância usando um dos templates existentes.

### Aplicações canônicas

| Tool | Header sub-action | Templates gerenciados | Audiência |
|---|---|---|---|
| Plans | "Manage types" | `plan-types` | Plans atrelados a profiles |
| Permissions | "Manage sets" | `permission-sets` | Permissions concedidas |
| Network > Internal | "Manage types" | `profile-types` (audience=internal) | Members listados |
| Network > External | "Manage types" | `profile-types` (audience=external) | Partners listados |

A escolha entre "types" e "sets" segue a terminologia natural do conceito — Plans tem "tipos de plano"; Permissions tem "conjuntos de permissões". Ambas variações são legítimas.

### Mental model para o usuário

Usuário entra na tool e vê **instances** (o que existe operacionalmente hoje — Plans atrelados a pessoas, Permissions concedidas a roles). Quando precisa criar mais um do mesmo molde, usa "+ New". Quando precisa **gerenciar os moldes em si** (criar um molde novo, ajustar um existente), abre "Manage types".

A separação é natural: instâncias mudam toda hora; templates mudam raramente.

## Architecture

### Sub-rotas internas

A tool tem duas sub-rotas internas (ou duas vistas — modal funciona igual conceitualmente):

- `/admin/{tool}/` — listing de instances. Vista padrão.
- `/admin/{tool}/types/` (ou `/sets/`) — gerenciador de templates. Aberto via header sub-action.

Ambas rotas pertencem à mesma tool, ao mesmo manifest, ao mesmo registry entry. Não há tools separadas.

### Schema separa tipos de objeto

A block family da tool inclui pelo menos dois blocks distintos:

- Block de instances (ex: `plans`, `permissions`, `profiles`).
- Block de templates (ex: `plan-types`, `permission-sets`, `profile-types`).

Instâncias têm FK para o template do qual derivam. Templates podem ser editados sem afetar instâncias já materializadas (instâncias podem herdar do template ou aplicar overrides — decisão por tool).

### Não há tools template-only

Decisão explícita: nunca criar `plan-types-tool`, `permission-sets-tool`, ou `profile-types-tool` como tools próprias. O gerenciamento de templates é responsabilidade da tool dona, exposta via Manage Types/Sets. Isso mantém a arquitetura enxuta e o vocabulário coeso.

## Operations

### Quando aplicar o pattern

Use o pattern quando **todas** as condições abaixo forem verdadeiras:

- ✓ A tool gerencia entidades que têm conceito de **template reutilizável** (ex: tipo de plano, conjunto de permissões, tipo de profile).
- ✓ A tool gerencia também **instances atreladas** a esses templates (ex: planos de pessoas reais, permissões concedidas, profiles cadastrados).
- ✓ Templates e instances vivem na **mesma block family** (mesma tool dona).

### Quando NÃO aplicar

- ✗ A tool gerencia apenas instâncias diretas, sem conceito de template (ex: Contracts — cada contrato é único, não há "tipo de contrato" reutilizável).
- ✗ Os templates já moram em outra tool dedicada e esta tool apenas consome (ex: tool A consome templates definidos em tool B). Nesse caso, referenciar a outra tool, não duplicar o gerenciamento.
- ✗ A relação template-instância é trivial (1:1) e não justifica vista separada.

### Checklist para implementar

1. **Identificar template e instance** dentro da family de blocks.
2. **Decidir terminologia**: "Manage types" ou "Manage sets"? Seguir o termo natural do conceito.
3. **Implementar header sub-action** na tool: botão/dropdown na header da listagem principal.
4. **Implementar sub-rota ou modal** para o gerenciador de templates.
5. **Definir herdança**: instâncias derivam do template no momento de criação? Override é permitido? Documentar.
6. **Validar o vocabulário com produto/design** antes de implementar — terminologia do header é parte do vocabulário oficial.

### Anti-patterns a evitar

- **Tool template-only**: criar `plan-types-tool` separada de `plans-tool` em vez de usar Manage Types. Pollui arquitetura e vocabulário.
- **Header sub-action enterrada**: colocar "Manage types" em menu profundo (settings, more menu) — affordance fica invisível.
- **Templates fora da family**: armazenar templates em block de outra tool. Quebra a coesão template/instance.
- **Forçar pattern onde não cabe**: aplicar Manage Types em tool que não tem conceito de template real. O pattern é seletivo.

## Glossary

- **manage-types-pattern**: pattern UX para tools que gerenciam templates + instances via header sub-action "Manage types".
- **manage-sets-pattern**: variação para tools cuja terminologia natural é "sets" em vez de "types" (ex: Permissions com "Manage sets").
- **template**: definição reutilizável de uma entidade — molde a partir do qual instâncias são derivadas.
- **instance**: entidade concreta atrelada a contexto específico, derivada de um template.
- **header sub-action**: affordance UX no header da tool (botão ou dropdown) que abre vista secundária da mesma tool.
- **governance pattern**: classe de patterns UX cuja função é organizar relação entre regras (templates) e operação (instances).

## Changelog

- **2026-05-04 (v1.0)** — Pattern cravado em sessão arquitetural R2.5 expandida (maio/2026). Aplicado canonicamente em Plans, Permissions, Network > Internal, Network > External. Substitui criação de tools template-only.

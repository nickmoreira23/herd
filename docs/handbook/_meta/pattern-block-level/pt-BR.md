---
title: "Pattern: Block"
description: "Blocks como single source of truth: hierarquia Family → Block → Block Group → Record, naming plural, sufixos canônicos."
locale: pt-BR
uid: herd.meta.pattern-block-level
---

> Para agentes de IA: este pattern é invariante arquitetural. Quando criar block novo, consulte aqui antes para escolher sufixo correto, decidir sobre Block Group, e garantir source attribution onde aplicável. Decisões cravadas em sessão arquitetural de maio/2026.

# Pattern: Block

Block é o nível de dado do HERD — single source of truth de um tipo de registro. Blocks vivem em famílias geradas por tools (ver `pattern-tool-level`); este pattern explica a estrutura interna de uma family, as convenções de naming, e os sufixos canônicos que codificam semântica.

## Business

Dados são ativos da empresa. Quando blocks consolidam tipos de dados em fontes únicas, a empresa ganha capacidade de auditoria, análise cruzada, e evolução incremental sem fragmentação. Quando dados se espalham em "tabelas ad-hoc por feature", o custo de qualquer pergunta cross-feature explode.

A consequência prática: cada tipo de dado tem **um** block como dono. Outras tools podem referenciar via foreign keys, mas não duplicam. Recognition referencia profiles via FK, mas não armazena cópia local de profile.

## Product

Blocks aparecem ao usuário como **coleções**. Por isso o naming é sempre plural: `products`, `contacts`, `meetings`, `recognition-events`, `points-balances`. Cada block representa "a lista de coisas desse tipo".

**Records** são as instâncias concretas que aparecem em telas — um produto específico ("Moon Milk"), um contato ("Maria Silva"), um evento de pontuação ("João ganhou 30 pts pela venda X").

**Block Group** é uma camada opcional de organização interna: agrupa records relacionados dentro do mesmo block. Beverages é um Block Group dentro do block `products`. Block Groups têm metadata leve própria (nome, ordem) mas não criam novo tipo de dado — são curadoria.

A regra para Block Group: aplique apenas onde organização interna ajuda. Products com 5.000 SKUs precisa. Locations com 10 endereços não precisa.

## Architecture

### Hierarquia interna

```
Block Family (gerada por uma Tool)
└── Block (categoria de dado)
    └── Block Group (agrupamento opcional)
        └── Record (instância concreta)
```

Cada nível tem responsabilidade distinta:

- **Block Family**: agrupamento de blocks correlacionados sob a mesma tool. Ex: Products family = `products` + `products-categories` + outros conforme tool cresce.
- **Block**: tabela conceitual única — um Prisma model próprio, CRUD próprio, lifecycle independente.
- **Block Group**: agrupamento intra-block declarativo. Sem CRUD próprio. Vive em metadata do block dono.
- **Record**: linha individual no block. O que o usuário cria, edita, lê.

### Sufixos canônicos

Sufixos no id do block codificam semântica. Aplicar sempre que a semântica casar:

| Sufixo | Função |
|---|---|
| (sem sufixo) | Bloco principal da family (ex: `products`, `contacts`) |
| `-categories` | Block Group naming |
| `-tracks` / `-systems` / `-rules` | Definições principais (Recognition, Ranking, Points) |
| `-levels` | Níveis nomeados (Recognition levels: Bronze, Silver, Gold) |
| `-criteria` | Condições reutilizáveis (requisitos para subir, regras de elegibilidade) |
| `-events` | Log temporal (com source attribution) |
| `-progress` | Estado atual contínuo (level atual + histórico do profile no track) |
| `-positions` | Ranking current + histórico congelado por período |
| `-balances` | Saldo atual dinâmico (atualiza on event) |
| `-snapshots` | Histórico congelado por período configurável |
| `-benefits` | Regras condicionais ativas em cada level |
| `-rewards` | Premiações singulares concedidas |
| `-stories` | Conteúdo narrativo publicável |
| `-payouts` | Pagamentos consolidados (auditados) |
| `-redemptions` | Resgates |
| `-transitions` | Log de mudanças de estado entre instâncias relacionadas |

Sufixos não são meramente cosméticos: distinguem semânticas que de outra forma seriam ambíguas. `recognition-events` é log; `recognition-progress` é estado atual; `recognition-snapshots` é foto histórica. Três blocks distintos, três responsabilidades distintas.

### Source attribution em events

Todo block com sufixo `-events` carrega campo polimórfico `source` apontando para o registro de origem. Detalhe completo em `pattern-source-attribution` (Batch 3). Resumo:

```
event {
  id, profile_id, value, occurred_at,
  source: { source_block, source_id, source_type }
}
```

Permite drill-down ("ganhei 30 pts por quê?" → click → abre venda original), auditoria, e reversão quando o evento de origem é cancelado.

### Distinção entre tipos de blocks de estado

Vocabulário comum confunde "estado atual" com "histórico". O HERD distingue:

- `-progress`: estado contínuo, sem período. Ex: level atual em `recognition-progress`.
- `-balances`: saldo dinâmico, atualiza on event. Ex: `points-balances`, `remuneration-balances`.
- `-positions`: ranking current + histórico congelado por período. Específico para Ranking.
- `-snapshots`: foto congelada por período configurável. Generaliza para qualquer state que precise histórico periódico.

Eventos individuais sempre permanecem em `-events` como source of truth — os outros blocks são projeções derivadas.

### Distinção semântica Profile vs profile-types vs profiles

Caso especial que ilustra como naming desambigua:

| Termo | Tipo | Localização | Singular/Plural |
|---|---|---|---|
| Profile (institucional) | Tool standalone | Organization area | Singular |
| Profile (pessoal — futuro) | Tool standalone | Identity area | Singular |
| `profile-types` | Block (gerenciado em Network "Manage types") | Network tool | Plural |
| `profiles` | Block (instâncias) | Network tool consome | Plural |

Sem colisão — contextos diferentes (área, layer, e singular vs plural) esclarecem. Mesmo princípio se aplica em qualquer family que tenha "tipo + instância" (plan-types/plans, permission-sets/permissions).

## Operations

### Checklist para criar block novo

1. **Tool dona**: a qual tool este block pertence? Se nenhuma → primeiro defina a tool (ver `pattern-tool-level`); blocks não vivem fora de family.
2. **Sufixo apropriado**: o block é log temporal? `-events`. Estado atual contínuo? `-progress` ou `-balances`. Foto histórica? `-snapshots`. Definição de regra? `-rules` ou `-tracks`. Sem sufixo se for o block principal da family.
3. **Naming sempre plural**: o id do block é plural (`products`, não `product`). Isso reflete que o block representa coleção.
4. **Block Group**: aplicável? Se sim, declarar dentro do `feature.yml` da tool dona, no campo `block_groups`. Não é entry separada.
5. **Source attribution**: o block é `-events`? Inclua campo `source` polimórfico. Sem isso, drill-down e reversão ficam impossíveis.
6. **Cross-references via FK**: quem este block referencia (profiles, products, etc.)? Use FK ao block dono — nunca duplicar dado.

### Anti-patterns a evitar

- **Block singular** (`product` em vez de `products`). Sempre plural — o block representa coleção.
- **Block fora de family**: criar block isolado sem tool dona. Toda data category vive em uma family.
- **Block sem sufixo quando aplicável**: criar `recognition-history` em vez de `recognition-snapshots`. Sufixos canônicos têm semântica precisa; nomes ad-hoc fragmentam.
- **Block duplicando dado de outro**: criar cópia local de profile dentro de Recognition em vez de FK para `profiles`. Duplicação fere o princípio de single source of truth.
- **Block-group como entry separada**: criar `_meta` ou directory próprio para block-group. Block Groups são metadata declarativa do block dono.

## Glossary

- **Block**: nível de dado — single source of truth de um tipo de registro. Sempre plural.
- **Block Family**: conjunto de blocks correlacionados gerados/manipulados por uma tool.
- **Block Group**: agrupamento opcional intra-block; metadata declarativa, sem CRUD próprio.
- **Record**: instância concreta dentro de um block — o que o usuário cria/edita/lê.
- **Sufixo canônico**: tag no id do block que codifica semântica (`-events`, `-snapshots`, `-progress`, etc.).
- **Source attribution**: campo polimórfico em events que aponta para o registro de origem (source_block + source_id + source_type).
- **Single source of truth**: princípio de que cada tipo de dado tem exatamente um block dono; outros referenciam via FK.

## Changelog

- **2026-05-04 (v1.0)** — Pattern cravado em sessão arquitetural R2.5 expandida (maio/2026). Estabelece a hierarquia Block Family → Block → Block Group → Record, naming sempre plural, sufixos canônicos como vocabulário compartilhado, e single source of truth como princípio inegociável.

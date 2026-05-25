---
title: "Pattern: Source Attribution"
description: "Campo polimórfico source em todo event apontando para o registro de origem — drill-down, auditoria, reversão."
locale: pt-BR
uid: herd.meta.pattern-source-attribution
---

> Para agentes de IA: este pattern é invariante crítica. Quando criar block de events em qualquer tool, sempre incluir campo `source` polimórfico. Sem isso, drill-down e reversão ficam impossíveis. Decisões cravadas em sessão arquitetural de maio/2026.

# Pattern: Source Attribution

Todo block de events em qualquer tool do ComeçaAI carrega um **campo polimórfico `source`** apontando para o registro de origem que causou o evento. O source identifica três coisas: o block de origem (`source_block`), o id do registro específico (`source_id`), e o tipo de evento que ocorreu (`source_type`). Sem essa atribuição, três capabilities críticas se tornam impossíveis: drill-down, auditoria e reversão automática.

## Business

A motivação é confiança. Sistemas que mexem com remuneração, pontuação, reconhecimento e classificação só sobrevivem auditoria se cada movimento puder ser rastreado de volta ao evento de negócio que o causou. Quando profile pergunta "como ganhei estes 30 pontos?", o sistema precisa responder com a venda específica, no produto específico, para o cliente específico — não com explicação genérica.

A consequência é dupla. Para o profile, source attribution gera **transparência operável**: clicar no efeito abre a causa. Para a empresa, gera **auditabilidade**: cada centavo pago em comissão, cada ponto creditado, cada ranking position pode ser justificado por evidência rastreável. E quando algo dá errado (venda cancelada, estorno, fraude detectada), source attribution permite **reversão automática em cadeia** — o sistema sabe quais events derivaram daquela venda e pode revertê-los sem intervenção manual.

## Product

### Drill-down em ação

Profile abre seu Points balance e vê linha "Ganhei 30 pts pela venda de Moon Milk para Arthur em 2026-04-15". Clica. O sistema usa o source para abrir a venda original em Marketplace — produto, cliente, valor, data, vendedor. Profile entende exatamente como o ponto foi gerado.

Mesmo padrão atravessa todas as tools de progression:

- **Recognition event** com source apontando para `capacitation-events` — "Subi de Bronze para Prata em 2026-03-10" → click → abre o curso completado que fez disparar a progressão.
- **Remuneration event** com source apontando para `marketplace-orders` — "Comissão de R$ 45 paga em 2026-04-01" → click → abre o pedido original.
- **Ranking points event** com source apontando para `products-sales` — "Pontos de ranking creditados em 2026-04-15" → click → abre a venda que gerou.

### Reversão automática

Quando o evento de origem é cancelado, todos os events derivados podem ser revertidos automaticamente. Venda cancelada em Marketplace dispara cascade: points-event correspondente é revertido (compensating entry), remuneration-event correspondente é revertido, recognition progress é recalculado se aplicável. Tudo via source attribution — o sistema sabe quais events apontam para a venda cancelada.

## Architecture

### Schema do campo source

Todo block com sufixo `-events` (ver `pattern-block-level`) carrega `source` como campo embutido:

```typescript
event {
  id, profile_id, value, occurred_at,
  source: {
    source_block: "products-sales" | "marketplace-orders" | "knowledge-content" | …
    source_id: <FK para registro específico>
    source_type: "sale-completed" | "course-completed" | "order-paid" | …
  }
}
```

Os três campos têm responsabilidades distintas:

- **`source_block`**: UID do block de origem. Ex: `herd.block.commerce.products-sales` ou `herd.block.commerce.marketplace-orders`.
- **`source_id`**: id (FK) do registro específico dentro daquele block. Aponta para a venda exata, o curso exato, o pedido exato.
- **`source_type`**: discriminator do tipo de evento dentro do source_block. Um mesmo block pode gerar múltiplos tipos de event (`sale-completed`, `sale-refunded`, `sale-amended`).

### Cross-tool data flow formalizado

Source attribution formaliza o fluxo de dados entre tools como invariante explícita:

| Tool de origem | Tool de destino | Tipo de cross-tool |
|---|---|---|
| Marketplace | Remuneration | order paga gera commission event |
| Marketplace | Points | order paga gera points event |
| Marketplace | Ranking | order paga gera ranking-points event |
| Knowledge | Capacitation | course completion gera capacitation event |
| Capacitation | Recognition | level-up em capacitation gera recognition progress |
| Marketplace | Recognition | venda cumpre criteria de recognition track |

Cada arrow nesta tabela vira um par `source_block` + `source_type` formal nos events da tool de destino. Isso permite que tools sejam **observadoras de events de outras tools** sem acoplamento rígido — cada uma sabe quais source patterns escutar.

### Reversal via source

Reversão é mecânica:

1. Evento de origem é marcado cancelado/estornado em sua tool dona.
2. Cascade handler busca por `source_block` + `source_id` em todos os blocks `-events` da plataforma.
3. Para cada event derivado encontrado, gera **compensating entry** (event com valor invertido + source apontando para o original).
4. Tools observam compensating entries e atualizam balances/progress/positions.

Crítico: nunca deletar events. Reversal sempre via compensating entry — preserva audit trail.

## Operations

### Checklist para criar block de events

1. **Sufixo `-events`**: o id do block segue convenção (ex: `points-events`, `recognition-events`, `remuneration-events`). Ver `pattern-block-level`.
2. **Campo `source` obrigatório**: incluir como tipo embutido com `source_block` + `source_id` + `source_type`.
3. **Validação de `source_block`**: deve referenciar UID válido de block existente. Adicionar validação no insert.
4. **Validação de `source_id`**: FK válida no momento da criação do event. Não admitir orphan events.
5. **Documentar `source_type` aceitos**: cada source_block tem conjunto enumerado de source_types possíveis.
6. **Reversal handler**: quando o block de origem permite cancelamento/estorno, definir handler que busca events derivados via source attribution e gera compensating entries.
7. **Ledger cross-cuts**: events que envolvem dinheiro (remuneration-events) também viram journal-entries no Ledger via source attribution paralela.

### Anti-patterns a evitar

- **Event sem source**: criar `points-events` sem campo source. Rompe audit trail e drill-down.
- **Source genérico**: usar string solta em vez de tripla estruturada (`source_block` + `source_id` + `source_type`). Quebra validação e cascade automática.
- **Source duplicando dado**: copiar valor da venda dentro do points-event. Errado: source aponta, não copia. Edição da venda original reflete via FK.
- **Deletar events em vez de reverter**: erase de event quebra histórico. Sempre compensating entry.

## Glossary

- **source-attribution**: pattern arquitetural onde todo event carrega referência polimórfica ao registro de origem.
- **polymorphic-reference**: referência composta por (block_uid + id + type) que aponta para tipos diversos de registros.
- **source-block**: campo do source apontando para o UID do block onde o registro de origem mora.
- **source-id**: campo do source apontando para a FK do registro específico de origem.
- **source-type**: discriminator do tipo de evento dentro do source_block (ex: sale-completed, sale-refunded).
- **drill-down**: navegação do efeito (event derivado) para a causa (registro de origem).
- **audit-trail**: histórico rastreável de events com origem identificável, usado para auditoria.
- **reversal-cascade**: propagação automática de reversão de um event original para todos os events derivados, via source attribution.
- **compensating entry**: event com valor invertido que neutraliza efeito de event anterior — preserva audit trail (não deleta).

## Changelog

- **2026-05-04 (v1.0)** — Pattern cravado em sessão arquitetural R2.5 expandida (maio/2026). Estabelece source attribution como invariante obrigatória em todo block `-events`. Habilita drill-down, audit-trail e reversal-cascade automática. Fluxo cross-tool formalizado via pares (source_block, source_type).

> Para agentes de IA: esta entrada documenta a mini-spec de R3 (packages refinement). Status: draft (planned). Investigação revelou que packages JÁ é tool em sales — R3 muda forma vs plano original.

# R3 — Packages Refinement

R3 refina o tool packages em sales. Originalmente o plano era "mover packages para dentro de products como block-group". Investigação durante R1.5 revelou que packages já existe como tool active (`sales/packages`). R3 vira refinement: investigar se o conceito "products bundled" (subset curado de products que compõe um package) merece estrutura própria como block-group dentro do block products.

## Business

packages é tool active — bundle de products+services+plans para venda. Permanece como tool. O refinement investiga se "products bundled" (subset curado) merece estrutura tipada própria como `ProductGroup` (block-group dentro de products), em vez de ficar como string array sem schema.

Para o cliente: nada visível muda no curto prazo. O refinement habilita evoluções futuras (preço bundled definido em ProductGroup, descontos comerciais por grupo, herança de attributes).

## Product

Nada visível ao user muda. Refinement interno do modelo de dados.

## Architecture

Tool packages compõe block-group products (`ProductGroup`) + outras coisas (preço bundled, contratos). Investigação durante R3:

- `ProductGroup` como block-group de products: nome, descrição, lista de productIds, metadata leve (preço bundled, descrição comercial).
- `BlockGroupSpec` dentro de `products.block.ts` ganha primeiro caso real (até R3, block-group existe apenas como categoria arquitetural cravada em R0.1 sem implementação real).
- Tool packages consume block products via `BlockConnection` com narrow scope (lê apenas `productGroups` dentro de products, não todo o block).

### Pré-condição

R2 (top-level features foundation) e R1 (tools foundation) já cravam o discriminator schema. R3 introduz primeiro `kind: "block_group"` real.

## Operations

- Workflow para criar package: select ProductGroup existente OU criar novo. Sub-workflow para criar ProductGroup vive em UI de products (não em tool packages).
- Migração de dados: se hoje package referencia productIds diretos como string array, migrar para FK em ProductGroup.
- `packages.tool.ts` (já existente) atualizado para declarar `BlockConnection` com path narrow (`products.productGroups`).

## Glossary

- **ProductGroup**: block-group dentro de products. Subset curado de productIds com metadata leve. Primeiro caso real do pattern block-group.
- **Bundled pricing**: preço definido no nível de ProductGroup, distinto da soma dos products individuais.
- **Package**: instância vendável que compõe um ProductGroup + termos comerciais (contrato, billing). Tool em sales.
- **Distinção package vs product-group**: package é a oferta comercial; product-group é o bundle de products subjacente. Um package consome um product-group.

## Changelog

- **2026-05-03** — Created (mini-spec). Status: draft, planned para R3. Primeiro caso real de block-group pattern.

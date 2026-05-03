> Para agentes de IA: esta entrada documenta a mini-spec de R5 (subscriptions split + offering creation). Status: draft (planned). É a etapa mais complexa do refator pós-R1.5.

# R5 — Subscriptions Split + Offering Creation

R5 separa o subscriptions monolito em duas camadas comerciais distintas: bloco residual (subscription real do cliente) + tool nova `subscription-offering` (catalog vendável). Consolida paths divergentes (components/tiers/, api/tiers/) em estrutura coerente.

## Business

subscriptions hoje mistura dois conceitos:

- **"Tier offering"** — catalog vendável: definição de plans, tiers, billing terms, agent access.
- **"Real subscription"** — registro do cliente: quem assinou qual tier, status do pagamento, billing cycle ativo, cancellations.

Modelos separados conceptualmente, mesmo arquivo e UI hoje. R5 separa em duas camadas comerciais distintas — uma vendável (offering), outra operacional (subscription real).

## Product

Usuário vê:

- `/admin/tools/sales/subscription-offering/` (NOVA tool) — onde define plans, tiers, billing terms para venda.
- `/admin/blocks/subscriptions/` (existente, residual) — onde gerencia subscriptions reais (clientes ativos, tiers que assinaram, status do pagamento, ações operacionais como pausar/cancelar).

## Architecture

- `Subscription` model permanece em subscriptions block (representação do cliente real).
- `SubscriptionTier` model move semanticamente para subscription-offering tool (model fica em mesmo schema Prisma; convenção de propriedade muda — owner é a tool).
- Components: `src/components/tiers/` → `src/components/tools/sales/subscription-offering/`. `src/components/subscriptions/` consolida (vira homonym do bloco subscriptions residual).
- API: `api/tiers/` → `api/subscription-offering/`. `api/subscriptions/` para subscriptions reais.
- subscription-offering tool com `BlockConnection[]` consumindo products (catalog), services (catalog), agents (access control via tier).
- Marketplace.composer pode referenciar subscription-offering tool em sections (item-detail-resolver atualizado).

### Pré-condição

R1 (tools foundation) e idealmente R4 (campaigns convergence) já fechadas. R5 é o segundo caso de criação de tool nova (depois de campaigns convergence em R4).

## Operations

- Workflow para criar nova tier: vai para `/admin/tools/sales/subscription-offering/`.
- Workflow para gerenciar subscription real (cancelar, pausar, ver status pagamento): fica em `/admin/blocks/subscriptions/`.
- Migração de URL: redirects de `/admin/blocks/tiers/` → `/admin/tools/sales/subscription-offering/`.
- i18n keys: namespace `tiers.*` migra para `subscriptionOffering.*` (ou similar — decisão durante execução).

## Glossary

- **Subscription**: real record do cliente (quem assina o quê, status, billing). Bloco residual.
- **SubscriptionTier**: offering structure — definição do plano/tier vendável. Owner conceitual é a tool subscription-offering.
- **subscription-offering**: tool em sales que define + vende tiers. Composta por products + services + agents.
- **BillingCycle**: ciclo de cobrança (monthly, annual, etc.). Atributo da subscription real.
- **SubscriptionStatus**: estados (ACTIVE, PAUSED, CANCELLED, PAST_DUE, TRIAL).
- **Tier access**: matriz de quais agents/features são acessíveis em cada tier.

## Changelog

- **2026-05-03** — Created (mini-spec). Status: draft, planned para R5. Etapa mais complexa do refator pós-R1.5.

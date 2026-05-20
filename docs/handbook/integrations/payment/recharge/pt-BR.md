---
title: Recharge
description: Provider de subscription billing para storefronts Shopify-native. Single-tenant V1 (Bucked Up), API key + webhooks dashboard-managed.
locale: pt-BR
uid: herd.integration.payment.recharge
---

# Recharge

Provider de subscription billing usado pelo storefront Bucked Up (Shopify-native). Adotado na Sub-etapa 9 (schema canonical) e Sub-etapa 10 revisada (API key path, webhook outbox).

## Business

Recharge processa cobrança recorrente de subscriptions vendidas no storefront. Toda receita Bucked Up reconciliada no HERD vem dele. A integração permite que finance/ops respondam, em um lugar canônico, perguntas tipo "quantas charges falharam este mês", "qual subscription gera mais MRR", etc., sem precisar logar no dashboard Recharge.

## Product

Setup atual (V1):

- **Auth:** API key admin (`RECHARGE_API_KEY`), encriptada em `Integration.credentials`.
- **Webhook registration:** manual via dashboard Recharge. URL: `${DEPLOY_URL}/api/webhooks/recharge`. 9 events registrados: `order/created`, `charge/{created,paid,failed,refunded}`, `subscription/{created,updated,cancelled,activated}`.
- **Admin views:** `/api/integrations/recharge/{charges,customers,plans,subscriptions}` para inspeção read-only.

Storefront Token (browser-side, customer-facing portal) é tech debt — virá quando HERD UI customer-facing nascer.

## Architecture

**Service:** `src/lib/services/recharge.ts`. `RechargeService.fromIntegration()` carrega credentials encrypted do Integration row e instancia o service. 10 métodos: `testConnection`, `listPlans`, `getPlan`, `listCharges`, `getCharge`, `listCustomers`, `listSubscriptions`, `listWebhooks`, `createWebhook`, `deleteWebhook` (3 últimos com `@todo` — dashboard-managed por enquanto).

**Manifest:** `src/lib/integrations/integrations/recharge.integration.ts`. `PaymentProviderAdapter` com `category: BILLING`, `authType: "api_key"`, `supportsOAuth: false`. 9 webhook events declarados.

**Webhook pipeline (Sub-etapa 10 revised):**
1. POST chega em `src/app/api/webhooks/recharge/route.ts`.
2. `RechargeWebhookVerifier` (`sha256(secret + body)` literal, NÃO HMAC).
3. Parse + `payload.id` como event_id de dedup.
4. `resolveTenantFromPayload` via `MemberConnection`.
5. Fast-path dedup + transaction atômica `webhook_dedup.create + emitDomainEvent`.
6. Ack 200.
7. Worker async invoca `rechargeHandler` (`src/lib/webhooks/handlers/recharge.handler.ts`), que escreve `IntegrationWebhookEvent` no tenant scope.

Sub-etapa 11 introduzirá o mapper raw → canonical (Charge/Subscription/BillingCustomer normalization).

## Operations

**First-time setup:**

1. Setar `RECHARGE_API_KEY` no `.env` local + Railway.
2. `npm run seed:recharge` cria/atualiza o Integration row.
3. No dashboard Recharge: registrar webhook URL `${DEPLOY_URL}/api/webhooks/recharge` com os 9 events listados acima.
4. Smoke test: dashboard tem botão "Send test webhook" — confirmar 200 + entry em `IntegrationWebhookEvent`.

**Tech debt rastreado em AGENTS.md:**

- Multi-tenant webhook subscription via API (dashboard-managed agora).
- Backfill histórico (forward-flow only V1).
- Storefront Token (browser-side customer portal).

## Glossary

- **Charge:** evento de cobrança Recharge (uma tentativa, status `success`/`failed`/etc.).
- **Order:** transação de checkout no storefront que gerou uma ou mais charges.
- **Subscription:** vínculo recorrente entre customer Recharge e plano Recharge.
- **Topic (X-Recharge-Topic header):** o tipo de evento Recharge (e.g. `charge/paid`, `subscription/cancelled`).
- **payload.id:** identificador stable do evento, usado como `eventId` no dedup.

## Changelog

- **2026-05-20 (Sub-etapa 10 revised):** API key path cravado. `fromIntegration()` factory criada, 4 admin routes refatoradas, webhook pipeline elevado para outbox (paridade com Gorgias/Intercom). Manifest `authType` corrigido para `api_key`. Entry handbook criada.
- **Pivot de OAuth:** spec original (pré-Fase 3) assumia OAuth Partner App. Engenheiro Bucked Up Recharge confirmou: "none of the other client id client secret stuff made any sense for recharge. it's all based on the api key." API key é o caminho.

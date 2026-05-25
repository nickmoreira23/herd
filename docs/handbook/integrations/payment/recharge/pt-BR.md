---
title: Recharge
description: Provider de subscription billing para storefronts Shopify-native. Single-tenant V1 (Bucked Up), API key + webhooks dashboard-managed.
locale: pt-BR
uid: herd.integration.payment.recharge
---

# Recharge

Provider de subscription billing usado pelo storefront Bucked Up (Shopify-native). Adotado na Sub-etapa 9 (schema canonical) e Sub-etapa 10 revisada (API key path, webhook outbox).

## Business

Recharge processa cobrança recorrente de subscriptions vendidas no storefront. Toda receita Bucked Up reconciliada no ComeçaAI vem dele. A integração permite que finance/ops respondam, em um lugar canônico, perguntas tipo "quantas charges falharam este mês", "qual subscription gera mais MRR", etc., sem precisar logar no dashboard Recharge.

## Product

Setup atual (V1):

- **Auth:** API key admin (`RECHARGE_API_KEY`), encriptada em `Integration.credentials`.
- **Webhook registration:** manual via dashboard Recharge. URL: `${DEPLOY_URL}/api/webhooks/recharge`. 9 events registrados: `order/created`, `charge/{created,paid,failed,refunded}`, `subscription/{created,updated,cancelled,activated}`.
- **Admin views:** `/api/integrations/recharge/{charges,customers,plans,subscriptions}` para inspeção read-only.

Storefront Token (browser-side, customer-facing portal) é tech debt — virá quando ComeçaAI UI customer-facing nascer.

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

1. Setar `RECHARGE_API_KEY` + `RECHARGE_WEBHOOK_SECRET` + `ENCRYPTION_KEY` + `NEXTAUTH_URL` no `.env` local + Railway.
2. `npm run seed:recharge` cria/atualiza o Integration row.
3. `npm run recharge:register-webhooks` (Sub-etapa 10.0.2) registra os 9 webhooks via API.

**Webhook management (Sub-etapa 10.0.2):**

A conta `bucked_up_herd_hl` é headless — não tem UI de webhook. Toda CRUD é via API. 3 scripts CLI:

```bash
# Listar webhooks atuais
npm run recharge:list-webhooks

# Registrar faltantes (idempotente: lista, diff vs manifest, cria os que faltam)
npm run recharge:register-webhooks

# Preview sem executar
npm run recharge:register-webhooks -- --dry-run

# Limpar obsoletos (webhooks no endpoint que não estão no manifest)
npm run recharge:register-webhooks -- --delete-obsolete

# Override base URL (default: NEXTAUTH_URL)
npm run recharge:register-webhooks -- --base-url https://app.example.com

# Deletar webhook individual por id
npm run recharge:delete-webhook -- --id 1234567
```

Scripts abortam se URL resolvida for `localhost*` (Recharge requer HTTPS). Source of truth de topics: `rechargeAdapter.manifest.webhookEvents`. `charge/paid` tem fallback automático para `charge/succeeded` em 422.

**Smoke test:** conta headless não tem botão "Send test webhook". Verificar via evento real (criar customer/charge de teste no admin Recharge) e confirmar entry em `IntegrationWebhookEvent` via psql/Prisma Studio.

**Tech debt rastreado em AGENTS.md:**

- Multi-tenant webhook subscription via API (scripts hoje atacam single Integration row).
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

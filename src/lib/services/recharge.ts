import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

const BASE_URL = "https://api.rechargeapps.com";

// ─── Recharge API Types ─────────────────────────────────────────────

/**
 * Sub-etapa 17.0.8.1 — Recharge renamed `/shop` to `/store`. Live probe
 * with 2021-11 API token returns 404 on `/shop` and 200 on `/store` with
 * payload shape `{ "store": { "id", "name", "email", "currency", ... } }`.
 * The `shop` field of the legacy payload no longer exists separately
 * from `name` — both pointed to the same human-readable label.
 *
 * Interface name preserved (RechargeShop) because nothing external
 * imports it today; renaming would churn no callers. If the legacy
 * `shop` field becomes needed by some consumer, it can be re-introduced
 * as optional and populated from `name`.
 */
export interface RechargeShop {
  id: number;
  email: string;
  name: string;
}

export interface RechargePlan {
  id: number;
  title: string;
  price: string;
  shopify_product_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RechargeCharge {
  id: number;
  customer_id: number;
  status: string;
  total_price: string;
  scheduled_at: string;
  processed_at: string | null;
  created_at: string;
}

export interface RechargeCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  created_at: string;
}

export interface RechargeSubscription {
  id: number;
  customer_id: number;
  status: string;
  price: string;
  product_title: string;
  next_charge_scheduled_at: string | null;
  created_at: string;
}

export interface RechargeWebhook {
  id: number;
  address: string;
  topic: string;
  created_at: string;
  updated_at: string;
}

// ─── Service Class ──────────────────────────────────────────────────

export class RechargeService {
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  /**
   * Factory that loads encrypted credentials from the platform-wide
   * Recharge `Integration` row (single-tenant in V1 — see AGENTS.md
   * "Integration is single-tenant"). Throws if not connected.
   *
   * Replaces the boilerplate `findUnique + decrypt + JSON.parse + new
   * RechargeService(...)` previously duplicated across the 4 admin routes.
   */
  static async fromIntegration(): Promise<RechargeService> {
    const integration = await prisma.integration.findUnique({
      where: { slug: "recharge" },
    });
    if (!integration?.credentials) {
      throw new Error("Recharge integration not connected (no credentials)");
    }
    if (integration.authType && integration.authType !== "api_key") {
      throw new Error(
        `Recharge integration authType is ${integration.authType}, expected 'api_key'`,
      );
    }
    const decrypted = decrypt(integration.credentials);
    const creds = JSON.parse(decrypted) as { apiToken: string };
    if (!creds.apiToken) {
      throw new Error("Recharge credentials missing apiToken");
    }
    return new RechargeService(creds.apiToken);
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "X-Recharge-Access-Token": this.apiToken,
        "Content-Type": "application/json",
        "X-Recharge-Version": "2021-11",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Recharge API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<{ shop: string; email: string }> {
    // Sub-etapa 17.0.8.1 — endpoint renamed `/shop` → `/store`. Outer
    // result key kept as `shop` for callers' backward compatibility.
    const data = await this.request<{ store: RechargeShop }>("/store");
    return { shop: data.store.name, email: data.store.email };
  }

  /**
   * Returns the Recharge shop id as a string. Used by the
   * `seed:connection` script to auto-discover `externalUserId` for
   * Recharge `MemberConnection` rows when no env var is set.
   *
   * Convention (see AGENTS.md "Convenção `externalUserId` per-provider"):
   * Recharge `externalUserId` may be the shop id, customer id, or
   * merchant id. The seed defaults to shop id when discovering via API.
   */
  async getShopId(): Promise<string> {
    // Sub-etapa 17.0.8.1 — endpoint renamed `/shop` → `/store`. The
    // method name retains "Shop" for backward compatibility — callers
    // semantically mean "the merchant's id at Recharge".
    const data = await this.request<{ store: RechargeShop }>("/store");
    return String(data.store.id);
  }

  // ── Plans / Products ──

  async listPlans(params?: { page?: number; limit?: number }): Promise<RechargePlan[]> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    const data = await this.request<{ products: RechargePlan[] }>(
      `/products${query ? `?${query}` : ""}`
    );
    return data.products;
  }

  async getPlan(id: string): Promise<RechargePlan> {
    const data = await this.request<{ product: RechargePlan }>(`/products/${id}`);
    return data.product;
  }

  // ── Charges ──

  async listCharges(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<RechargeCharge[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    const data = await this.request<{ charges: RechargeCharge[] }>(
      `/charges${query ? `?${query}` : ""}`
    );
    return data.charges;
  }

  async getCharge(id: string): Promise<RechargeCharge> {
    const data = await this.request<{ charge: RechargeCharge }>(`/charges/${id}`);
    return data.charge;
  }

  // ── Customers ──

  async listCustomers(params?: {
    email?: string;
    page?: number;
    limit?: number;
  }): Promise<RechargeCustomer[]> {
    const qs = new URLSearchParams();
    if (params?.email) qs.set("email", params.email);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    const data = await this.request<{ customers: RechargeCustomer[] }>(
      `/customers${query ? `?${query}` : ""}`
    );
    return data.customers;
  }

  // ── Subscriptions ──

  async listSubscriptions(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<RechargeSubscription[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    const data = await this.request<{ subscriptions: RechargeSubscription[] }>(
      `/subscriptions${query ? `?${query}` : ""}`
    );
    return data.subscriptions;
  }

  // ── Webhooks ──
  //
  // Webhook management methods used by the recharge:register-webhooks,
  // recharge:list-webhooks, and recharge:delete-webhook CLI scripts.
  //
  // Programmatic-only path: the bucked_up_herd_hl headless Recharge account
  // does not expose webhook management in the UI, so all CRUD goes through
  // these methods. Multi-tenant evolution: scripts will accept a --tenant-id
  // arg when multi-tenant lands; today they target the single platform-wide
  // Integration row.
  //
  // @see scripts/register-recharge-webhooks.ts
  // @see scripts/list-recharge-webhooks.ts
  // @see scripts/delete-recharge-webhook.ts

  async listWebhooks(): Promise<RechargeWebhook[]> {
    const data = await this.request<{ webhooks: RechargeWebhook[] }>("/webhooks");
    return data.webhooks;
  }

  async createWebhook(topic: string, address: string): Promise<RechargeWebhook> {
    const data = await this.request<{ webhook: RechargeWebhook }>("/webhooks", {
      method: "POST",
      body: JSON.stringify({ topic, address }),
    });
    return data.webhook;
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.request(`/webhooks/${id}`, { method: "DELETE" });
  }
}

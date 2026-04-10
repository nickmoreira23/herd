const BASE_URL = "https://api.rechargeapps.com";

// ─── Recharge API Types ─────────────────────────────────────────────

export interface RechargeShop {
  id: number;
  email: string;
  shop: string;
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
    const data = await this.request<{ shop: RechargeShop }>("/shop");
    return { shop: data.shop.name || data.shop.shop, email: data.shop.email };
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

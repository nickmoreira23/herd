const BASE_URL_V1 = "https://api.stability.ai/v1";
const BASE_URL_V2 = "https://api.stability.ai/v2beta";

// ─── Stability AI API Types ────────────────────────────────────

export interface StabilityAccount {
  id: string;
  email: string;
  profile_picture?: string;
  organizations?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

export interface StabilityEngine {
  id: string;
  name: string;
  description: string;
  type: string;
  ready: boolean;
}

// ─── Service Class ────────────────────────────────────────────────

export class StabilityAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Stability AI API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<StabilityAccount> {
    return this.request<StabilityAccount>(`${BASE_URL_V1}/user/account`);
  }

  // ── Engines ──

  async listEngines(): Promise<StabilityEngine[]> {
    return this.request<StabilityEngine[]>(`${BASE_URL_V1}/engines/list`);
  }

  // ── Stats ──

  async getStats(): Promise<{
    id: string;
    email: string;
    engineCount: number;
  }> {
    const account = await this.testConnection();
    let engineCount = 0;
    try {
      const engines = await this.listEngines();
      engineCount = engines.length;
    } catch {
      // Engines may not be accessible
    }

    return {
      id: account.id,
      email: account.email,
      engineCount,
    };
  }
}

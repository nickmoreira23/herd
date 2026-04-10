const BASE_URL = "https://api.gamma.app/v1";

// ─── Gamma API Types ────────────────────────────────────────────

export interface GammaAccount {
  id: string;
  email: string;
  name?: string;
}

export interface GammaModel {
  id: string;
  name: string;
  description?: string;
  type?: string;
  status?: string;
}

export interface GammaGeneration {
  id: string;
  model_id: string;
  status: string;
  created_at: string;
  completed_at?: string;
  output_url?: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class GammaService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gamma API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<GammaAccount> {
    return this.request<GammaAccount>("/account/me");
  }

  // ── Models ──

  async listModels(): Promise<GammaModel[]> {
    const data = await this.request<{ models: GammaModel[] }>("/models");
    return data.models;
  }

  // ── Generations ──

  async listGenerations(limit = 25): Promise<GammaGeneration[]> {
    const data = await this.request<{ generations: GammaGeneration[] }>(
      `/generations?limit=${limit}`
    );
    return data.generations;
  }

  // ── Stats ──

  async getStats(): Promise<{
    modelCount: number;
    generationCount: number;
  }> {
    let modelCount = 0;
    let generationCount = 0;

    try {
      const models = await this.listModels();
      modelCount = models.length;
    } catch {
      // Models may not be accessible
    }

    try {
      const generations = await this.listGenerations(50);
      generationCount = generations.length;
    } catch {
      // Generations may not be accessible
    }

    return {
      modelCount,
      generationCount,
    };
  }
}

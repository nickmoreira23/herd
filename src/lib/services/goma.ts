const BASE_URL = "https://api.goma.app/v1";

// ─── Goma API Types ────────────────────────────────────────────

export interface GomaAccount {
  id: string;
  email: string;
  name?: string;
}

export interface GomaModel {
  id: string;
  name: string;
  description?: string;
  type?: string;
  status?: string;
}

export interface GomaGeneration {
  id: string;
  model_id: string;
  status: string;
  created_at: string;
  completed_at?: string;
  output_url?: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class GomaService {
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
      throw new Error(`Goma API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<GomaAccount> {
    return this.request<GomaAccount>("/account/me");
  }

  // ── Models ──

  async listModels(): Promise<GomaModel[]> {
    const data = await this.request<{ models: GomaModel[] }>("/models");
    return data.models;
  }

  // ── Generations ──

  async listGenerations(limit = 25): Promise<GomaGeneration[]> {
    const data = await this.request<{ generations: GomaGeneration[] }>(
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

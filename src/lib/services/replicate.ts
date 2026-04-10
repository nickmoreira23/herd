const BASE_URL = "https://api.replicate.com/v1";

// ─── Replicate API Types ───────────────────────────────────────

export interface ReplicateAccount {
  type: string;
  username: string;
  name: string;
  github_url?: string;
}

export interface ReplicateModel {
  url: string;
  owner: string;
  name: string;
  description?: string;
  visibility: string;
  run_count?: number;
  cover_image_url?: string;
  latest_version?: {
    id: string;
    created_at: string;
  };
}

export interface ReplicatePrediction {
  id: string;
  model: string;
  version: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  created_at: string;
  completed_at?: string;
  urls: {
    get: string;
    cancel?: string;
  };
}

// ─── Service Class ────────────────────────────────────────────────

export class ReplicateService {
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Replicate API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<ReplicateAccount> {
    return this.request<ReplicateAccount>("/account");
  }

  // ── Models ──

  async listModels(
    owner?: string
  ): Promise<ReplicateModel[]> {
    const path = owner ? `/models/${owner}` : "/models";
    const data = await this.request<{ results: ReplicateModel[] }>(path);
    return data.results;
  }

  // ── Predictions ──

  async listPredictions(
    cursor?: string
  ): Promise<{ results: ReplicatePrediction[]; next?: string }> {
    const path = cursor ? `/predictions?cursor=${cursor}` : "/predictions";
    return this.request<{ results: ReplicatePrediction[]; next?: string }>(
      path
    );
  }

  // ── Stats ──

  async getStats(): Promise<{
    username: string;
    name: string;
    predictionCount: number;
  }> {
    const account = await this.testConnection();
    let predictionCount = 0;
    try {
      const predictions = await this.listPredictions();
      predictionCount = predictions.results.length;
    } catch {
      // Predictions may not be accessible
    }

    return {
      username: account.username,
      name: account.name,
      predictionCount,
    };
  }
}

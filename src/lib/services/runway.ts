const BASE_URL = "https://api.runwayml.com/v1";

// ─── Runway API Types ──────────────────────────────────────────

export interface RunwayTask {
  id: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  createdAt: string;
  failure?: string;
  failureCode?: string;
  output?: string[];
  progress?: number;
}

// ─── Service Class ────────────────────────────────────────────────

export class RunwayService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "X-Runway-Version": "2024-11-06",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Runway API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<RunwayTask[]> {
    return this.request<RunwayTask[]>("/tasks?limit=1");
  }

  // ── Tasks ──

  async listTasks(limit = 25): Promise<RunwayTask[]> {
    return this.request<RunwayTask[]>(`/tasks?limit=${limit}`);
  }

  async getTask(taskId: string): Promise<RunwayTask> {
    return this.request<RunwayTask>(`/tasks/${taskId}`);
  }

  // ── Stats ──

  async getStats(): Promise<{
    recentTaskCount: number;
  }> {
    let recentTaskCount = 0;
    try {
      const tasks = await this.listTasks(50);
      recentTaskCount = tasks.length;
    } catch {
      // Tasks may not be accessible
    }

    return {
      recentTaskCount,
    };
  }
}

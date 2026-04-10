const BASE_URL = "https://api.notion.com/v1";

// ─── Notion API Types ─────────────────────────────────────────────

export interface NotionDatabase {
  id: string;
  title: Array<{ plain_text: string }>;
  properties: Record<string, { type: string; [key: string]: unknown }>;
}

export interface NotionPage {
  id: string;
  url: string;
  properties: Record<string, unknown>;
  created_time: string;
  last_edited_time: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class NotionTasksService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Notion API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/users/me");
  }

  // ── Databases ──

  async searchDatabases(): Promise<NotionDatabase[]> {
    const data = await this.request<{ results: NotionDatabase[] }>("/search", {
      method: "POST",
      body: JSON.stringify({
        filter: { property: "object", value: "database" },
      }),
    });
    return data.results;
  }

  async queryDatabase(
    databaseId: string,
    startCursor?: string
  ): Promise<{ results: NotionPage[]; next_cursor: string | null }> {
    const body: Record<string, unknown> = {};
    if (startCursor) body.start_cursor = startCursor;

    return this.request<{
      results: NotionPage[];
      next_cursor: string | null;
    }>(`/databases/${databaseId}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // ── Pages ──

  async getPage(pageId: string): Promise<NotionPage> {
    return this.request<NotionPage>(`/pages/${pageId}`);
  }

  // ── Helpers ──

  extractTitle(properties: Record<string, unknown>): string | null {
    for (const value of Object.values(properties)) {
      const prop = value as Record<string, unknown>;
      if (prop.type === "title") {
        const titleArr = prop.title as Array<{ plain_text: string }> | undefined;
        if (titleArr && titleArr.length > 0) {
          return titleArr.map((t) => t.plain_text).join("");
        }
      }
    }
    return null;
  }

  extractStatus(properties: Record<string, unknown>): string | null {
    const statusKeys = ["Status", "State"];
    for (const key of statusKeys) {
      const prop = properties[key] as Record<string, unknown> | undefined;
      if (!prop) continue;

      if (prop.type === "status") {
        const status = prop.status as { name: string } | null;
        return status?.name ?? null;
      }
      if (prop.type === "select") {
        const select = prop.select as { name: string } | null;
        return select?.name ?? null;
      }
    }
    return null;
  }

  extractPriority(properties: Record<string, unknown>): string | null {
    const prop = properties["Priority"] as Record<string, unknown> | undefined;
    if (!prop) return null;

    if (prop.type === "select") {
      const select = prop.select as { name: string } | null;
      return select?.name ?? null;
    }
    return null;
  }

  extractDate(properties: Record<string, unknown>): string | null {
    const dateKeys = ["Due", "Due Date", "Deadline"];
    for (const key of dateKeys) {
      const prop = properties[key] as Record<string, unknown> | undefined;
      if (!prop) continue;

      if (prop.type === "date") {
        const date = prop.date as { start: string } | null;
        return date?.start ?? null;
      }
    }
    return null;
  }

  extractAssignee(properties: Record<string, unknown>): string | null {
    for (const value of Object.values(properties)) {
      const prop = value as Record<string, unknown>;
      if (prop.type === "people") {
        const people = prop.people as Array<{ name: string }> | undefined;
        if (people && people.length > 0) {
          return people[0].name;
        }
      }
    }
    return null;
  }
}

const BASE_URL = "https://app.asana.com/api/1.0";

// ─── Asana API Types ──────────────────────────────────────────────

export interface AsanaWorkspace {
  gid: string;
  name: string;
}

export interface AsanaProject {
  gid: string;
  name: string;
  workspace: AsanaWorkspace;
}

export interface AsanaTask {
  gid: string;
  name: string;
  notes: string;
  completed: boolean;
  completed_at: string | null;
  due_on: string | null;
  assignee: { gid: string; name: string; email: string } | null;
  memberships: Array<{ project: { gid: string; name: string } }>;
  tags: Array<{ name: string }>;
  permalink_url: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class AsanaService {
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
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Asana API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<Record<string, unknown>> {
    const data = await this.request<{ data: Record<string, unknown> }>(
      "/users/me"
    );
    return data.data;
  }

  // ── Workspaces ──

  async listWorkspaces(): Promise<AsanaWorkspace[]> {
    const data = await this.request<{ data: AsanaWorkspace[] }>("/workspaces");
    return data.data;
  }

  // ── Projects ──

  async listProjects(workspaceGid: string): Promise<AsanaProject[]> {
    const data = await this.request<{ data: AsanaProject[] }>(
      `/workspaces/${workspaceGid}/projects?opt_fields=name,workspace`
    );
    return data.data;
  }

  // ── Tasks ──

  private static readonly TASK_OPT_FIELDS = [
    "name",
    "notes",
    "completed",
    "completed_at",
    "due_on",
    "assignee",
    "assignee.name",
    "assignee.email",
    "memberships.project.name",
    "tags.name",
    "permalink_url",
  ].join(",");

  async listTasks(projectGid: string): Promise<AsanaTask[]> {
    const data = await this.request<{ data: AsanaTask[] }>(
      `/projects/${projectGid}/tasks?opt_fields=${AsanaService.TASK_OPT_FIELDS}`
    );
    return data.data;
  }

  async getTask(taskGid: string): Promise<AsanaTask> {
    const data = await this.request<{ data: AsanaTask }>(
      `/tasks/${taskGid}?opt_fields=${AsanaService.TASK_OPT_FIELDS}`
    );
    return data.data;
  }
}

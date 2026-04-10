const BASE_URL = "https://api.clickup.com/api/v2";

// ─── ClickUp API Types ────────────────────────────────────────────

export interface ClickUpWorkspace {
  id: string;
  name: string;
}

export interface ClickUpSpace {
  id: string;
  name: string;
}

export interface ClickUpFolder {
  id: string;
  name: string;
}

export interface ClickUpList {
  id: string;
  name: string;
  space: { id: string; name: string };
  folder: { id: string; name: string } | null;
  statuses: Array<{ status: string; type: string; color: string }>;
}

export interface ClickUpTask {
  id: string;
  name: string;
  description: string | null;
  status: { status: string; type: string };
  priority: { id: string; priority: string } | null;
  assignees: Array<{ username: string; profilePicture: string | null }>;
  due_date: string | null;
  tags: Array<{ name: string }>;
  url: string;
  list: { name: string };
  date_created: string;
  date_updated: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class ClickUpService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: this.token,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`ClickUp API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<Record<string, unknown>> {
    const data = await this.request<{ user: Record<string, unknown> }>("/user");
    return data.user;
  }

  // ── Workspaces ──

  async listWorkspaces(): Promise<ClickUpWorkspace[]> {
    const data = await this.request<{ teams: ClickUpWorkspace[] }>("/team");
    return data.teams;
  }

  // ── Spaces ──

  async listSpaces(teamId: string): Promise<ClickUpSpace[]> {
    const data = await this.request<{ spaces: ClickUpSpace[] }>(
      `/team/${teamId}/space`
    );
    return data.spaces;
  }

  // ── Folders ──

  async listFolders(spaceId: string): Promise<ClickUpFolder[]> {
    const data = await this.request<{ folders: ClickUpFolder[] }>(
      `/space/${spaceId}/folder`
    );
    return data.folders;
  }

  // ── Lists ──

  async listFolderlessLists(spaceId: string): Promise<ClickUpList[]> {
    const data = await this.request<{ lists: ClickUpList[] }>(
      `/space/${spaceId}/list`
    );
    return data.lists;
  }

  async listLists(folderId: string): Promise<ClickUpList[]> {
    const data = await this.request<{ lists: ClickUpList[] }>(
      `/folder/${folderId}/list`
    );
    return data.lists;
  }

  // ── Tasks ──

  async listTasks(listId: string): Promise<ClickUpTask[]> {
    const data = await this.request<{ tasks: ClickUpTask[] }>(
      `/list/${listId}/task`
    );
    return data.tasks;
  }

  async getTask(taskId: string): Promise<ClickUpTask> {
    return this.request<ClickUpTask>(`/task/${taskId}`);
  }
}

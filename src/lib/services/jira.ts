// ─── Jira API Types ───────────────────────────────────────────────

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: unknown;
    status: { name: string; statusCategory: { key: string } };
    priority: { name: string };
    assignee: { displayName: string; emailAddress: string } | null;
    duedate: string | null;
    labels: string[];
    project: { key: string; name: string };
    issuetype: { name: string };
    created: string;
    updated: string;
  };
}

// ─── Service Class ────────────────────────────────────────────────

export class JiraService {
  private baseUrl: string;
  private authHeader: string;

  constructor(domain: string, email: string, token: string) {
    // Strip .atlassian.net if included in the domain
    const cleanDomain = domain.replace(/\.atlassian\.net$/i, "");
    this.baseUrl = `https://${cleanDomain}.atlassian.net/rest/api/3`;
    this.authHeader = `Basic ${btoa(`${email}:${token}`)}`;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Jira API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/myself");
  }

  // ── Projects ──

  async listProjects(): Promise<JiraProject[]> {
    return this.request<JiraProject[]>("/project");
  }

  // ── Issues ──

  private static readonly SEARCH_FIELDS = [
    "summary",
    "description",
    "status",
    "priority",
    "assignee",
    "duedate",
    "labels",
    "project",
    "issuetype",
    "created",
    "updated",
  ];

  async searchIssues(
    jql: string,
    startAt = 0,
    maxResults = 50
  ): Promise<{ issues: JiraIssue[]; total: number; startAt: number; maxResults: number }> {
    return this.request<{
      issues: JiraIssue[];
      total: number;
      startAt: number;
      maxResults: number;
    }>("/search", {
      method: "POST",
      body: JSON.stringify({
        jql,
        startAt,
        maxResults,
        fields: JiraService.SEARCH_FIELDS,
      }),
    });
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    return this.request<JiraIssue>(`/issue/${issueKey}`);
  }
}

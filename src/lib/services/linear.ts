const BASE_URL = "https://api.linear.app/graphql";

// ─── Linear API Types ─────────────────────────────────────────────

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  state: { name: string; type: string };
  priority: number;
  priorityLabel: string;
  assignee: { name: string; email: string } | null;
  dueDate: string | null;
  labels: { nodes: Array<{ name: string }> };
  project: { name: string } | null;
  url: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class LinearService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async graphql<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: this.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Linear API error ${res.status}: ${body}`);
    }

    const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };

    if (json.errors && json.errors.length > 0) {
      throw new Error(
        `Linear GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`
      );
    }

    return json.data as T;
  }

  // ── Connection ──

  async testConnection(): Promise<{ id: string; name: string; email: string }> {
    const data = await this.graphql<{
      viewer: { id: string; name: string; email: string };
    }>(`query { viewer { id name email } }`);
    return data.viewer;
  }

  // ── Teams ──

  async listTeams(): Promise<LinearTeam[]> {
    const data = await this.graphql<{
      teams: { nodes: LinearTeam[] };
    }>(`query { teams { nodes { id name key } } }`);
    return data.teams.nodes;
  }

  // ── Issues ──

  private static readonly ISSUE_FIELDS = `
    id
    identifier
    title
    description
    state { name type }
    priority
    priorityLabel
    assignee { name email }
    dueDate
    labels { nodes { name } }
    project { name }
    url
    createdAt
    updatedAt
  `;

  async listIssues(
    teamId?: string,
    first = 50,
    after?: string
  ): Promise<{
    nodes: LinearIssue[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  }> {
    const filterClause = teamId
      ? `filter: { team: { id: { eq: $teamId } } },`
      : "";

    const query = `
      query ListIssues($teamId: String, $first: Int!, $after: String) {
        issues(${filterClause} first: $first, after: $after) {
          nodes {
            ${LinearService.ISSUE_FIELDS}
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const data = await this.graphql<{
      issues: {
        nodes: LinearIssue[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>(query, { teamId, first, after });

    return data.issues;
  }

  async getIssue(issueId: string): Promise<LinearIssue> {
    const query = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          ${LinearService.ISSUE_FIELDS}
        }
      }
    `;

    const data = await this.graphql<{ issue: LinearIssue }>(query, {
      id: issueId,
    });

    return data.issue;
  }
}

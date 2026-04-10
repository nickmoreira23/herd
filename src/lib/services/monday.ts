const BASE_URL = "https://api.monday.com/v2";

// ─── Monday API Types ─────────────────────────────────────────────

export interface MondayBoard {
  id: string;
  name: string;
  description: string | null;
  state: string;
  board_kind: string;
}

export interface MondayColumnValue {
  id: string;
  title: string;
  text: string | null;
  type: string;
}

export interface MondayItem {
  id: string;
  name: string;
  column_values: MondayColumnValue[];
  group: { title: string };
  created_at: string;
  updated_at: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class MondayService {
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
        "API-Version": "2024-10",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Monday API error ${res.status}: ${body}`);
    }

    const json = (await res.json()) as {
      data?: T;
      errors?: Array<{ message: string }>;
    };

    if (json.errors && json.errors.length > 0) {
      throw new Error(
        `Monday GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`
      );
    }

    return json.data as T;
  }

  // ── Connection ──

  async testConnection(): Promise<{ id: string; name: string; email: string }> {
    const data = await this.graphql<{
      me: { id: string; name: string; email: string };
    }>(`query { me { id name email } }`);
    return data.me;
  }

  // ── Boards ──

  async listBoards(): Promise<MondayBoard[]> {
    const data = await this.graphql<{ boards: MondayBoard[] }>(`
      query {
        boards(limit: 50, state: active) {
          id
          name
          description
          state
          board_kind
        }
      }
    `);
    return data.boards;
  }

  // ── Items ──

  async listItems(
    boardId: string,
    cursor?: string
  ): Promise<{ cursor: string | null; items: MondayItem[] }> {
    const cursorArg = cursor ? `, cursor: "${cursor}"` : "";
    const data = await this.graphql<{
      boards: Array<{
        items_page: { cursor: string | null; items: MondayItem[] };
      }>;
    }>(`
      query {
        boards(ids: [${boardId}]) {
          items_page(limit: 100${cursorArg}) {
            cursor
            items {
              id
              name
              column_values {
                id
                title
                text
                type
              }
              group {
                title
              }
              created_at
              updated_at
            }
          }
        }
      }
    `);

    const board = data.boards[0];
    if (!board) {
      return { cursor: null, items: [] };
    }
    return board.items_page;
  }

  async getItem(itemId: string): Promise<MondayItem | null> {
    const data = await this.graphql<{ items: MondayItem[] }>(`
      query {
        items(ids: [${itemId}]) {
          id
          name
          column_values {
            id
            title
            text
            type
          }
          group {
            title
          }
          created_at
          updated_at
        }
      }
    `);

    return data.items[0] ?? null;
  }

  // ── Helpers ──

  extractStatus(columnValues: MondayColumnValue[]): string | null {
    const col = columnValues.find((c) => c.title === "Status");
    return col?.text ?? null;
  }

  extractPriority(columnValues: MondayColumnValue[]): string | null {
    const col = columnValues.find((c) => c.title === "Priority");
    return col?.text ?? null;
  }

  extractDueDate(columnValues: MondayColumnValue[]): string | null {
    const col = columnValues.find((c) => c.type === "date");
    return col?.text ?? null;
  }

  extractAssignee(columnValues: MondayColumnValue[]): string | null {
    const col = columnValues.find(
      (c) =>
        c.type === "people" ||
        c.title === "Person" ||
        c.title === "Assignee"
    );
    return col?.text ?? null;
  }
}

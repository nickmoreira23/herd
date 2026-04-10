const BASE_URL = "https://api.trello.com/1";

// ─── Trello API Types ─────────────────────────────────────────────

export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  url: string;
  closed: boolean;
}

export interface TrelloList {
  id: string;
  name: string;
  idBoard: string;
  closed: boolean;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  due: string | null;
  dueComplete: boolean;
  idList: string;
  idBoard: string;
  labels: Array<{ name: string; color: string }>;
  members: Array<{ fullName: string; username: string }>;
  shortUrl: string;
  closed: boolean;
}

// ─── Service Class ────────────────────────────────────────────────

export class TrelloService {
  private apiKey: string;
  private token: string;

  constructor(apiKey: string, token: string) {
    this.apiKey = apiKey;
    this.token = token;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const separator = path.includes("?") ? "&" : "?";
    const url = `${BASE_URL}${path}${separator}key=${this.apiKey}&token=${this.token}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Trello API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/members/me");
  }

  // ── Boards ──

  async listBoards(): Promise<TrelloBoard[]> {
    return this.request<TrelloBoard[]>("/members/me/boards?filter=open");
  }

  // ── Lists ──

  async listLists(boardId: string): Promise<TrelloList[]> {
    return this.request<TrelloList[]>(
      `/boards/${boardId}/lists?filter=open`
    );
  }

  // ── Cards ──

  async listCards(boardId: string): Promise<TrelloCard[]> {
    return this.request<TrelloCard[]>(
      `/boards/${boardId}/cards?filter=open&members=true`
    );
  }

  async getCard(cardId: string): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}?members=true`);
  }
}

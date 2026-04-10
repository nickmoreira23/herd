const BASE_URL = "https://api.attio.com/v2";

// ─── Attio API Types ──────────────────────────────────────────────

export interface AttioWorkspaceMember {
  id: { workspace_member_id: string };
  first_name: string;
  last_name: string;
  email_address: string;
  avatar_url: string | null;
}

export interface AttioObject {
  id: { object_id: string };
  api_slug: string;
  singular_noun: string;
  plural_noun: string;
}

export interface AttioList {
  id: { list_id: string };
  api_slug: string;
  name: string;
  parent_object: string[];
  workspace_access: string;
}

export interface AttioRecordAttribute {
  attribute_type: string;
  title?: Array<{ value: string }>;
  first_name?: Array<{ first_name: string }>;
  last_name?: Array<{ last_name: string }>;
  email_addresses?: Array<{ email_address: string }>;
  [key: string]: unknown;
}

export interface AttioRecord {
  id: { record_id: string; object_id: string };
  values: Record<string, AttioRecordAttribute[]>;
  created_at: string;
}

export interface AttioListEntry {
  id: { entry_id: string };
  record_id: string;
  created_at: string;
  parent_record_id?: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class AttioService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<T> {
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
      throw new Error(`Attio API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<AttioWorkspaceMember> {
    const data = await this.request<{ data: AttioWorkspaceMember }>(
      "/self"
    );
    return data.data;
  }

  // ── Objects ──

  async listObjects(): Promise<AttioObject[]> {
    const data = await this.request<{ data: AttioObject[] }>("/objects");
    return data.data;
  }

  // ── Lists ──

  async listLists(): Promise<AttioList[]> {
    const data = await this.request<{ data: AttioList[] }>("/lists");
    return data.data;
  }

  // ── Records ──

  async queryRecords(
    objectSlug: string,
    options?: { limit?: number; offset?: number }
  ): Promise<AttioRecord[]> {
    const data = await this.request<{ data: AttioRecord[] }>(
      `/objects/${objectSlug}/records/query`,
      {
        method: "POST",
        body: JSON.stringify({
          limit: options?.limit ?? 50,
          offset: options?.offset ?? 0,
        }),
      }
    );
    return data.data;
  }

  async getRecord(
    objectSlug: string,
    recordId: string
  ): Promise<AttioRecord> {
    const data = await this.request<{ data: AttioRecord }>(
      `/objects/${objectSlug}/records/${recordId}`
    );
    return data.data;
  }

  // ── List Entries ──

  async queryListEntries(
    listSlug: string,
    options?: { limit?: number; offset?: number }
  ): Promise<AttioListEntry[]> {
    const data = await this.request<{ data: AttioListEntry[] }>(
      `/lists/${listSlug}/entries/query`,
      {
        method: "POST",
        body: JSON.stringify({
          limit: options?.limit ?? 50,
          offset: options?.offset ?? 0,
        }),
      }
    );
    return data.data;
  }

  // ── Notes ──

  async listNotes(
    parentObject: string,
    parentRecordId: string
  ): Promise<Array<{ id: { note_id: string }; title: string; content_plaintext: string; created_at: string }>> {
    const data = await this.request<{
      data: Array<{
        id: { note_id: string };
        title: string;
        content_plaintext: string;
        created_at: string;
      }>;
    }>(`/notes?parent_object=${parentObject}&parent_record_id=${parentRecordId}`);
    return data.data;
  }

  // ── Stats helpers ──

  async getStats(): Promise<{
    people: number;
    companies: number;
    lists: AttioList[];
  }> {
    const [people, companies, lists] = await Promise.all([
      this.queryRecords("people", { limit: 1 }).then((r) => r.length),
      this.queryRecords("companies", { limit: 1 }).then((r) => r.length),
      this.listLists(),
    ]);

    // Get approximate counts by querying
    let peopleCount = 0;
    let companiesCount = 0;

    try {
      const pRecords = await this.queryRecords("people", { limit: 50 });
      peopleCount = pRecords.length;
    } catch {
      // May not have people object
    }

    try {
      const cRecords = await this.queryRecords("companies", { limit: 50 });
      companiesCount = cRecords.length;
    } catch {
      // May not have companies object
    }

    return {
      people: peopleCount,
      companies: companiesCount,
      lists,
    };
  }
}

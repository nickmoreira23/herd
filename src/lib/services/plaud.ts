const BASE_URLS: Record<string, string> = {
  us: "https://api.plaud.ai",
  eu: "https://api-euc1.plaud.ai",
};

// ─── Plaud API Types ────────────────────────────────────────────────

export interface PlaudRecording {
  id: string;
  filename: string;
  fullname: string;
  filesize: number;
  duration: number;
  start_time: number;
  end_time: number;
  is_trash: boolean;
  is_trans: boolean;
  is_summary: boolean;
  keywords: string[];
  serial_number: string;
}

export interface PlaudRecordingDetail extends PlaudRecording {
  transcript: string;
  summary?: string;
}

export interface PlaudUserInfo {
  id: string;
  nickname: string;
  email: string;
  country: string;
  membership_type: string;
}

export interface PlaudTag {
  id: string;
  name: string;
  color?: string;
}

// ─── Service Class ──────────────────────────────────────────────────

export class PlaudService {
  private token: string;
  private region: string;

  constructor(token: string, region: "us" | "eu" = "us") {
    this.token = token;
    this.region = region;
  }

  private get baseUrl(): string {
    return BASE_URLS[this.region] || BASE_URLS.us;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Plaud API error ${res.status}: ${body}`);
    }

    const data = await res.json();

    // Handle region mismatch — Plaud returns status -302 with correct domain
    if (data?.status === -302 && data?.data?.domains?.api) {
      const domain: string = data.data.domains.api;
      this.region = domain.includes("euc1") ? "eu" : "us";
      return this.request<T>(path, options);
    }

    return data as T;
  }

  // ── Connection ──

  async testConnection(): Promise<PlaudUserInfo> {
    const data = await this.request<{ data: PlaudUserInfo }>("/user/me");
    return data.data;
  }

  // ── Recordings ──

  async listRecordings(): Promise<PlaudRecording[]> {
    const data = await this.request<{
      data_file_list?: PlaudRecording[];
      data?: PlaudRecording[];
    }>("/file/simple/web");
    const list = data.data_file_list ?? data.data ?? [];
    return list.filter((r) => !r.is_trash);
  }

  async getRecordingDetail(
    fileId: string
  ): Promise<PlaudRecordingDetail> {
    const data = await this.request<{ data?: Record<string, unknown> }>(
      `/file/detail/${fileId}`
    );
    const raw = (data.data ?? data) as Record<string, unknown>;

    // Extract transcript — the longest content from pre_download_content_list
    let transcript = "";
    const preDownload = (raw.pre_download_content_list as Array<{ data_content?: string }>) ?? [];
    for (const item of preDownload) {
      const content = item.data_content ?? "";
      if (content.length > transcript.length) transcript = content;
    }

    // Extract summary from pre_download_content_list or direct field
    let summary: string | undefined;
    for (const item of preDownload) {
      const raw_item = item as Record<string, unknown>;
      if (raw_item.content_type === "summary" && raw_item.data_content) {
        summary = raw_item.data_content as string;
        break;
      }
    }
    if (!summary && typeof raw.summary === "string") {
      summary = raw.summary;
    }

    return {
      id: (raw.file_id as string) ?? fileId,
      filename: (raw.file_name as string) ?? (raw.filename as string) ?? fileId,
      fullname: (raw.fullname as string) ?? "",
      filesize: (raw.filesize as number) ?? (raw.file_size as number) ?? 0,
      duration: (raw.duration as number) ?? 0,
      start_time: (raw.start_time as number) ?? 0,
      end_time: (raw.end_time as number) ?? 0,
      is_trash: (raw.is_trash as boolean) ?? false,
      is_trans: (raw.is_trans as boolean) ?? false,
      is_summary: (raw.is_summary as boolean) ?? false,
      keywords: (raw.keywords as string[]) ?? [],
      serial_number: (raw.serial_number as string) ?? "",
      transcript,
      summary,
    };
  }

  // ── Audio Download ──

  async downloadAudio(fileId: string): Promise<ArrayBuffer> {
    const res = await fetch(`${this.baseUrl}/file/download/${fileId}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`Plaud download failed: ${res.status}`);
    return res.arrayBuffer();
  }

  async getMp3Url(fileId: string): Promise<string | null> {
    try {
      const data = await this.request<Record<string, unknown>>(
        `/file/temp-url/${fileId}?is_opus=false`
      );
      return (
        (data?.url as string) ??
        ((data?.data as Record<string, unknown>)?.url as string) ??
        (data?.temp_url as string) ??
        null
      );
    } catch {
      return null;
    }
  }

  // ── Tags ──

  async listTags(): Promise<PlaudTag[]> {
    const data = await this.request<{ data?: PlaudTag[] }>("/filetag/");
    return data.data ?? [];
  }

  // ── User ──

  async getUserInfo(): Promise<PlaudUserInfo> {
    const data = await this.request<{ data: PlaudUserInfo }>("/user/me");
    return data.data;
  }
}

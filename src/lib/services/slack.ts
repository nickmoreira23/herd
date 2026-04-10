import { getValidIntegrationToken } from "@/lib/services/integration-oauth";

const BASE_URL = "https://slack.com/api";

// ─── Slack API Types ────────────────────────────────────────────────

export interface SlackTeam {
  id: string;
  name: string;
  domain: string;
  icon?: { image_34: string; image_44: string; image_68: string; image_88: string; image_132: string };
}

export interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  real_name: string;
  profile: {
    email?: string;
    display_name: string;
    real_name: string;
    image_24: string;
    image_48: string;
    image_72: string;
    image_192: string;
    title?: string;
    status_text?: string;
    status_emoji?: string;
  };
  is_admin: boolean;
  is_owner: boolean;
  is_bot: boolean;
  deleted: boolean;
  tz?: string;
  tz_label?: string;
  updated: number;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  is_archived: boolean;
  is_general: boolean;
  is_member: boolean;
  topic?: { value: string };
  purpose?: { value: string };
  num_members: number;
  created: number;
}

export interface SlackMessage {
  type: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  reply_count?: number;
  reactions?: Array<{ name: string; count: number; users: string[] }>;
}

// ─── Service Class ──────────────────────────────────────────────────

export class SlackService {
  private integrationId: string;

  constructor(integrationId: string) {
    this.integrationId = integrationId;
  }

  private async request<T>(
    method: string,
    params?: Record<string, string>
  ): Promise<T> {
    const token = await getValidIntegrationToken(this.integrationId);
    const qs = new URLSearchParams(params || {});
    const res = await fetch(`${BASE_URL}/${method}?${qs.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!res.ok) {
      throw new Error(`Slack API error ${res.status}`);
    }

    const data = await res.json();
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return data;
  }

  // ── Team ──

  async getTeamInfo(): Promise<SlackTeam> {
    const data = await this.request<{ team: SlackTeam }>("team.info");
    return data.team;
  }

  // ── Users ──

  async listUsers(limit = 100): Promise<SlackUser[]> {
    const data = await this.request<{ members: SlackUser[] }>("users.list", {
      limit: String(limit),
    });
    return data.members.filter((m) => !m.deleted && !m.is_bot);
  }

  async getUserInfo(userId: string): Promise<SlackUser> {
    const data = await this.request<{ user: SlackUser }>("users.info", {
      user: userId,
    });
    return data.user;
  }

  // ── Channels ──

  async listChannels(
    types = "public_channel,private_channel",
    limit = 100
  ): Promise<SlackChannel[]> {
    const data = await this.request<{ channels: SlackChannel[] }>(
      "conversations.list",
      {
        types,
        limit: String(limit),
        exclude_archived: "true",
      }
    );
    return data.channels;
  }

  // ── Messages ──

  async getChannelHistory(
    channelId: string,
    limit = 20
  ): Promise<SlackMessage[]> {
    const data = await this.request<{ messages: SlackMessage[] }>(
      "conversations.history",
      {
        channel: channelId,
        limit: String(limit),
      }
    );
    return data.messages;
  }

  // ── Post Message ──

  async postMessage(
    channel: string,
    text: string,
    threadTs?: string
  ): Promise<{ ts: string; channel: string }> {
    const token = await getValidIntegrationToken(this.integrationId);
    const res = await fetch(`${BASE_URL}/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        text,
        ...(threadTs ? { thread_ts: threadTs } : {}),
      }),
    });

    const data = await res.json();
    if (!data.ok) throw new Error(`Slack postMessage error: ${data.error}`);
    return { ts: data.ts, channel: data.channel };
  }

  // ── Auth Test (verify connection) ──

  async testConnection(): Promise<{
    ok: boolean;
    user: string;
    team: string;
    user_id: string;
    team_id: string;
  }> {
    return this.request("auth.test");
  }
}

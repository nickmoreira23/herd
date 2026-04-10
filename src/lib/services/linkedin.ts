const API_URL = "https://api.linkedin.com/v2";
const COMMUNITY_URL = "https://api.linkedin.com/rest";

// ─── LinkedIn API Types ──────────────────────────────────────────

export interface LinkedInProfile {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  email?: string;
  picture?: string;
}

export interface LinkedInOrganization {
  id: number;
  localizedName: string;
  vanityName?: string;
  logoV2?: { original: string };
  followerCount?: number;
}

export interface LinkedInPost {
  id: string;
  author: string;
  commentary?: string;
  publishedAt: number;
  lifecycleState: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class LinkedInService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;

    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202401",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`LinkedIn API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<LinkedInProfile> {
    // Use OpenID userinfo endpoint
    const res = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${this.token}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`LinkedIn connection test failed ${res.status}: ${body}`);
    }

    return res.json() as Promise<LinkedInProfile>;
  }

  // ── Profile ──

  async getProfile(): Promise<LinkedInProfile> {
    return this.testConnection();
  }

  // ── Organizations ──

  async listOrganizations(): Promise<LinkedInOrganization[]> {
    try {
      const data = await this.request<{
        elements: Array<{
          organization: string;
          "organization~"?: LinkedInOrganization;
          role: string;
        }>;
      }>(
        "/organizationalEntityAcls?q=roleAssignee&projection=(elements*(organization~(id,localizedName,vanityName)))"
      );
      return data.elements
        .filter((e) => e["organization~"])
        .map((e) => e["organization~"] as LinkedInOrganization);
    } catch {
      return [];
    }
  }

  // ── Stats ──

  async getStats(): Promise<{
    name: string;
    email: string | undefined;
    organizations: Array<{ id: number; name: string }>;
  }> {
    const profile = await this.getProfile();
    const orgs = await this.listOrganizations();

    return {
      name: profile.name,
      email: profile.email,
      organizations: orgs.map((o) => ({ id: o.id, name: o.localizedName })),
    };
  }
}

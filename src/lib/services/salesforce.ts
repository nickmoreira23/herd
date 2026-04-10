// ─── Salesforce API Types ──────────────────────────────────────────

export interface SalesforceIdentity {
  user_id: string;
  organization_id: string;
  username: string;
  display_name: string;
  email: string;
}

export interface SObjectDescribe {
  name: string;
  label: string;
  labelPlural: string;
  keyPrefix: string | null;
  queryable: boolean;
  createable: boolean;
  updateable: boolean;
  custom: boolean;
}

export interface SObjectsResponse {
  sobjects: SObjectDescribe[];
}

export interface SoqlQueryResult<T = Record<string, unknown>> {
  totalSize: number;
  done: boolean;
  nextRecordsUrl?: string;
  records: T[];
}

export interface SalesforceAccount {
  Id: string;
  Name: string;
  Type: string | null;
  Industry: string | null;
  Website: string | null;
  Phone: string | null;
  BillingCity: string | null;
  BillingState: string | null;
  BillingCountry: string | null;
  CreatedDate: string;
}

export interface SalesforceContact {
  Id: string;
  FirstName: string | null;
  LastName: string;
  Email: string | null;
  Phone: string | null;
  Title: string | null;
  AccountId: string | null;
  Account?: { Name: string } | null;
  CreatedDate: string;
}

export interface SalesforceOpportunity {
  Id: string;
  Name: string;
  StageName: string;
  Amount: number | null;
  CloseDate: string;
  AccountId: string | null;
  Account?: { Name: string } | null;
  OwnerId: string;
  CreatedDate: string;
}

export interface SalesforceLead {
  Id: string;
  FirstName: string | null;
  LastName: string;
  Email: string | null;
  Company: string | null;
  Status: string;
  Phone: string | null;
  CreatedDate: string;
}

// ─── Service Class ────────────────────────────────────────────────

export class SalesforceService {
  private token: string;
  private instanceUrl: string;
  private apiVersion = "v59.0";

  constructor(token: string, instanceUrl: string) {
    this.token = token;
    // Normalize instance URL: strip trailing slash, ensure https
    this.instanceUrl = instanceUrl.replace(/\/+$/, "");
    if (!this.instanceUrl.startsWith("https://")) {
      this.instanceUrl = `https://${this.instanceUrl}`;
    }
    // Add .my.salesforce.com if no domain suffix provided
    if (!this.instanceUrl.includes(".")) {
      this.instanceUrl = `https://${instanceUrl}.my.salesforce.com`;
    }
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = path.startsWith("http")
      ? path
      : `${this.instanceUrl}/services/data/${this.apiVersion}${path}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Salesforce API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Connection ──

  async testConnection(): Promise<SalesforceIdentity> {
    // Use the identity endpoint via the /services/data endpoint
    const versions = await fetch(
      `${this.instanceUrl}/services/data/${this.apiVersion}/limits`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!versions.ok) {
      const body = await versions.text();
      throw new Error(`Salesforce connection test failed ${versions.status}: ${body}`);
    }

    // Get user info
    const userInfo = await fetch(`${this.instanceUrl}/services/oauth2/userinfo`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });

    if (!userInfo.ok) {
      // Fallback: if userinfo doesn't work, connection still passed via limits check
      return {
        user_id: "",
        organization_id: "",
        username: "",
        display_name: "Connected",
        email: "",
      };
    }

    return userInfo.json() as Promise<SalesforceIdentity>;
  }

  // ── SObjects ──

  async listSObjects(): Promise<SObjectDescribe[]> {
    const data = await this.request<SObjectsResponse>("/sobjects");
    return data.sobjects;
  }

  // ── SOQL Query ──

  async query<T = Record<string, unknown>>(
    soql: string
  ): Promise<SoqlQueryResult<T>> {
    return this.request<SoqlQueryResult<T>>(
      `/query?q=${encodeURIComponent(soql)}`
    );
  }

  async queryMore<T = Record<string, unknown>>(
    nextRecordsUrl: string
  ): Promise<SoqlQueryResult<T>> {
    return this.request<SoqlQueryResult<T>>(
      `${this.instanceUrl}${nextRecordsUrl}`
    );
  }

  // ── Accounts ──

  async listAccounts(limit = 100): Promise<SalesforceAccount[]> {
    const result = await this.query<SalesforceAccount>(
      `SELECT Id, Name, Type, Industry, Website, Phone, BillingCity, BillingState, BillingCountry, CreatedDate FROM Account ORDER BY CreatedDate DESC LIMIT ${limit}`
    );
    return result.records;
  }

  // ── Contacts ──

  async listContacts(limit = 100): Promise<SalesforceContact[]> {
    const result = await this.query<SalesforceContact>(
      `SELECT Id, FirstName, LastName, Email, Phone, Title, AccountId, Account.Name, CreatedDate FROM Contact ORDER BY CreatedDate DESC LIMIT ${limit}`
    );
    return result.records;
  }

  // ── Opportunities ──

  async listOpportunities(limit = 100): Promise<SalesforceOpportunity[]> {
    const result = await this.query<SalesforceOpportunity>(
      `SELECT Id, Name, StageName, Amount, CloseDate, AccountId, Account.Name, OwnerId, CreatedDate FROM Opportunity ORDER BY CreatedDate DESC LIMIT ${limit}`
    );
    return result.records;
  }

  // ── Leads ──

  async listLeads(limit = 100): Promise<SalesforceLead[]> {
    const result = await this.query<SalesforceLead>(
      `SELECT Id, FirstName, LastName, Email, Company, Status, Phone, CreatedDate FROM Lead ORDER BY CreatedDate DESC LIMIT ${limit}`
    );
    return result.records;
  }

  // ── Stats helpers ──

  async getStats(): Promise<{
    accounts: number;
    contacts: number;
    opportunities: number;
    leads: number;
  }> {
    const [accounts, contacts, opportunities, leads] = await Promise.all([
      this.query("SELECT COUNT() FROM Account").then((r) => r.totalSize),
      this.query("SELECT COUNT() FROM Contact").then((r) => r.totalSize),
      this.query("SELECT COUNT() FROM Opportunity").then((r) => r.totalSize),
      this.query("SELECT COUNT() FROM Lead").then((r) => r.totalSize),
    ]);

    return { accounts, contacts, opportunities, leads };
  }
}

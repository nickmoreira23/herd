const BASE_URL = "https://api.ouraring.com";

// ─── Oura API Types ────────────────────────────────────────────────

export interface OuraPersonalInfo {
  id: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  biological_sex: string | null;
  email: string | null;
}

export interface OuraDailySleep {
  id: string;
  day: string;
  score: number | null;
  timestamp: string;
  contributors: {
    deep_sleep: number | null;
    efficiency: number | null;
    latency: number | null;
    rem_sleep: number | null;
    restfulness: number | null;
    timing: number | null;
    total_sleep: number | null;
  };
}

export interface OuraDailyActivity {
  id: string;
  day: string;
  score: number | null;
  timestamp: string;
  active_calories: number;
  steps: number;
  total_calories: number;
  equivalent_walking_distance: number;
  high_activity_time: number;
  medium_activity_time: number;
  low_activity_time: number;
  sedentary_time: number;
  resting_time: number;
  contributors: {
    meet_daily_targets: number | null;
    move_every_hour: number | null;
    recovery_time: number | null;
    stay_active: number | null;
    training_frequency: number | null;
    training_volume: number | null;
  };
}

export interface OuraDailyReadiness {
  id: string;
  day: string;
  score: number | null;
  timestamp: string;
  temperature_deviation: number | null;
  temperature_trend_deviation: number | null;
  contributors: {
    activity_balance: number | null;
    body_temperature: number | null;
    hrv_balance: number | null;
    previous_day_activity: number | null;
    previous_night: number | null;
    recovery_index: number | null;
    resting_heart_rate: number | null;
    sleep_balance: number | null;
  };
}

export interface OuraHeartRate {
  bpm: number;
  source: string;
  timestamp: string;
}

interface OuraPaginatedResponse<T> {
  data: T[];
  next_token: string | null;
}

// ─── Service Class ──────────────────────────────────────────────────

export class OuraService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Oura API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  private async fetchAll<T>(path: string, params: Record<string, string>): Promise<T[]> {
    const all: T[] = [];
    let nextToken: string | null = null;

    do {
      const reqParams = { ...params };
      if (nextToken) reqParams.next_token = nextToken;

      const response = await this.request<OuraPaginatedResponse<T>>(path, reqParams);
      all.push(...response.data);
      nextToken = response.next_token;
    } while (nextToken);

    return all;
  }

  // ── Connection ──

  async testConnection(): Promise<{ email: string | null }> {
    const data = await this.request<OuraPersonalInfo>("/v2/usercollection/personal_info");
    return { email: data.email };
  }

  // ── Data Fetching ──

  async getDailySleep(startDate: string, endDate: string): Promise<OuraDailySleep[]> {
    return this.fetchAll<OuraDailySleep>("/v2/usercollection/daily_sleep", {
      start_date: startDate,
      end_date: endDate,
    });
  }

  async getDailyActivity(startDate: string, endDate: string): Promise<OuraDailyActivity[]> {
    return this.fetchAll<OuraDailyActivity>("/v2/usercollection/daily_activity", {
      start_date: startDate,
      end_date: endDate,
    });
  }

  async getDailyReadiness(startDate: string, endDate: string): Promise<OuraDailyReadiness[]> {
    return this.fetchAll<OuraDailyReadiness>("/v2/usercollection/daily_readiness", {
      start_date: startDate,
      end_date: endDate,
    });
  }

  async getHeartRate(startDate: string, endDate: string): Promise<OuraHeartRate[]> {
    return this.fetchAll<OuraHeartRate>("/v2/usercollection/heartrate", {
      start_datetime: `${startDate}T00:00:00+00:00`,
      end_datetime: `${endDate}T23:59:59+00:00`,
    });
  }
}

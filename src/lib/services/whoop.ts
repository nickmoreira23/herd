const BASE_URL = "https://api.prod.whoop.com";

// ─── WHOOP API Types ───────────────────────────────────────────────

export interface WhoopUserProfile {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface WhoopBodyMeasurement {
  height_meter: number;
  weight_kilogram: number;
  max_heart_rate: number;
}

export interface WhoopCycle {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string | null;
  timezone_offset: string;
  score_state: string;
  score: {
    strain: number;
    kilojoule: number;
    average_heart_rate: number;
    max_heart_rate: number;
  } | null;
}

export interface WhoopRecovery {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage: number | null;
    skin_temp_celsius: number | null;
  } | null;
}

export interface WhoopSleep {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed: {
      baseline_milli: number;
      need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number;
      need_from_recent_nap_milli: number;
    };
    respiratory_rate: number;
    sleep_performance_percentage: number | null;
    sleep_consistency_percentage: number | null;
    sleep_efficiency_percentage: number | null;
  } | null;
}

export interface WhoopWorkout {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_id: number;
  score_state: string;
  score: {
    strain: number;
    average_heart_rate: number;
    max_heart_rate: number;
    kilojoule: number;
    percent_recorded: number;
    distance_meter: number | null;
    altitude_gain_meter: number | null;
    altitude_change_meter: number | null;
    zone_duration: {
      zone_zero_milli: number;
      zone_one_milli: number;
      zone_two_milli: number;
      zone_three_milli: number;
      zone_four_milli: number;
      zone_five_milli: number;
    };
  } | null;
}

interface WhoopPaginatedResponse<T> {
  records: T[];
  next_token: string | null;
}

// ─── Service Class ──────────────────────────────────────────────────

export class WhoopService {
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
      throw new Error(`WHOOP API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  private async fetchAll<T>(path: string, params: Record<string, string>): Promise<T[]> {
    const all: T[] = [];
    let nextToken: string | null = null;

    do {
      const reqParams: Record<string, string> = { ...params, limit: "25" };
      if (nextToken) reqParams.nextToken = nextToken;

      const response = await this.request<WhoopPaginatedResponse<T>>(path, reqParams);
      all.push(...response.records);
      nextToken = response.next_token;
    } while (nextToken);

    return all;
  }

  // ── Connection ──

  async testConnection(): Promise<{ userId: number; email: string }> {
    const data = await this.request<WhoopUserProfile>("/developer/v1/user/profile/basic");
    return { userId: data.user_id, email: data.email };
  }

  // ── Data Fetching ──

  async getCycles(startDate: string, endDate: string): Promise<WhoopCycle[]> {
    return this.fetchAll<WhoopCycle>("/developer/v1/cycle", {
      start: `${startDate}T00:00:00.000Z`,
      end: `${endDate}T23:59:59.000Z`,
    });
  }

  async getRecovery(startDate: string, endDate: string): Promise<WhoopRecovery[]> {
    return this.fetchAll<WhoopRecovery>("/developer/v1/recovery", {
      start: `${startDate}T00:00:00.000Z`,
      end: `${endDate}T23:59:59.000Z`,
    });
  }

  async getSleep(startDate: string, endDate: string): Promise<WhoopSleep[]> {
    return this.fetchAll<WhoopSleep>("/developer/v1/activity/sleep", {
      start: `${startDate}T00:00:00.000Z`,
      end: `${endDate}T23:59:59.000Z`,
    });
  }

  async getWorkouts(startDate: string, endDate: string): Promise<WhoopWorkout[]> {
    return this.fetchAll<WhoopWorkout>("/developer/v1/activity/workout", {
      start: `${startDate}T00:00:00.000Z`,
      end: `${endDate}T23:59:59.000Z`,
    });
  }

  async getBodyMeasurements(): Promise<WhoopBodyMeasurement> {
    return this.request<WhoopBodyMeasurement>("/developer/v1/user/measurement/body");
  }
}

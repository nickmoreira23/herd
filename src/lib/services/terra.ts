const BASE_URL = "https://api.tryterra.co/v2";

// ─── Terra API Types ──────────────────────────────────────────────

export interface TerraSleep {
  start_time: string;
  end_time: string;
  metadata: {
    start_time: string;
    end_time: string;
  };
  sleep_durations_data: {
    asleep: {
      duration_asleep_state_seconds: number;
      duration_deep_sleep_state_seconds: number;
      duration_light_sleep_state_seconds: number;
      duration_REM_sleep_state_seconds: number;
    };
    awake: {
      duration_awake_state_seconds: number;
    };
    other: {
      duration_in_bed_seconds: number;
    };
    num_REM_events: number | null;
  } | null;
  sleep_rating_data: {
    overall_sleep_rating: number | null;
  } | null;
  heart_rate_data: {
    summary: {
      avg_hr_bpm: number | null;
      min_hr_bpm: number | null;
      max_hr_bpm: number | null;
      resting_hr_bpm: number | null;
    };
  } | null;
  respiration_data: {
    breaths_data: {
      avg_breaths_per_min: number | null;
    };
  } | null;
}

export interface TerraActivity {
  metadata: {
    start_time: string;
    end_time: string;
    name: string | null;
    type: string | null;
  };
  distance_data: {
    summary: {
      distance_meters: number | null;
    };
  } | null;
  calories_data: {
    total_burned_calories: number | null;
    net_activity_calories: number | null;
  } | null;
  heart_rate_data: {
    summary: {
      avg_hr_bpm: number | null;
      max_hr_bpm: number | null;
      resting_hr_bpm: number | null;
    };
  } | null;
  active_durations_data: {
    activity_seconds: number | null;
    low_intensity_seconds: number | null;
    moderate_intensity_seconds: number | null;
    vigorous_intensity_seconds: number | null;
  } | null;
  movement_data: {
    steps_data: {
      steps: number | null;
    };
  } | null;
}

export interface TerraBody {
  metadata: {
    start_time: string;
    end_time: string;
  };
  measurements_data: {
    measurements: Array<{
      measurement_time: string | null;
      BMI: number | null;
      weight_kg: number | null;
      height_cm: number | null;
      body_fat_percentage: number | null;
    }>;
  } | null;
  heart_data: {
    heart_rate_data: {
      summary: {
        avg_hr_bpm: number | null;
        resting_hr_bpm: number | null;
      };
    };
  } | null;
}

export interface TerraNutrition {
  metadata: {
    start_time: string;
    end_time: string;
  };
  summary: {
    macros: {
      calories: number | null;
      protein_g: number | null;
      fat_g: number | null;
      carbohydrates_g: number | null;
      fiber_g: number | null;
      sugar_g: number | null;
    };
    water_ml: number | null;
  } | null;
}

interface TerraDataResponse<T> {
  status: string;
  type: string;
  user: { user_id: string };
  data: T[];
}

interface TerraWidgetResponse {
  status: string;
  url: string;
  session_id: string;
}

// ─── Service Class ──────────────────────────────────────────────────

export class TerraService {
  private devId: string;
  private apiKey: string;

  constructor(devId: string, apiKey: string) {
    this.devId = devId;
    this.apiKey = apiKey;
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
        "dev-id": this.devId,
        "x-api-key": this.apiKey,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Terra API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Widget Session ──

  async generateWidgetSession(referenceId: string): Promise<{ url: string; sessionId: string }> {
    const res = await fetch(`${BASE_URL}/auth/generateWidgetSession`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "dev-id": this.devId,
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        reference_id: referenceId,
        providers: "APPLE",
        language: "en",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Terra widget session error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as TerraWidgetResponse;
    return { url: data.url, sessionId: data.session_id };
  }

  // ── Data Fetching ──

  async getSleep(userId: string, startDate: string, endDate: string): Promise<TerraSleep[]> {
    const data = await this.request<TerraDataResponse<TerraSleep>>("/sleep", {
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      to_webhook: "false",
    });
    return data.data;
  }

  async getActivity(userId: string, startDate: string, endDate: string): Promise<TerraActivity[]> {
    const data = await this.request<TerraDataResponse<TerraActivity>>("/activity", {
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      to_webhook: "false",
    });
    return data.data;
  }

  async getBody(userId: string, startDate: string, endDate: string): Promise<TerraBody[]> {
    const data = await this.request<TerraDataResponse<TerraBody>>("/body", {
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      to_webhook: "false",
    });
    return data.data;
  }

  async getNutrition(userId: string, startDate: string, endDate: string): Promise<TerraNutrition[]> {
    const data = await this.request<TerraDataResponse<TerraNutrition>>("/nutrition", {
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      to_webhook: "false",
    });
    return data.data;
  }
}

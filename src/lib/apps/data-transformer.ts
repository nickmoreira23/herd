/**
 * Converts structured fitness data JSON into natural language text
 * suitable for RAG indexing and semantic search.
 *
 * Each transformer handles app-specific raw data shapes (Oura vs WHOOP)
 * but outputs consistent, readable paragraphs.
 */
export function transformDataPoint(
  appSlug: string,
  category: string,
  date: Date,
  rawData: unknown
): string {
  const dateStr = formatDate(date);
  const data = rawData as Record<string, unknown>;

  if (appSlug === "oura") {
    switch (category) {
      case "SLEEP":
        return transformOuraSleep(dateStr, data);
      case "ACTIVITY":
        return transformOuraActivity(dateStr, data);
      case "READINESS":
        return transformOuraReadiness(dateStr, data);
      case "HEART_RATE":
        return transformOuraHeartRate(dateStr, data);
      default:
        return transformGeneric(appSlug, category, dateStr, data);
    }
  }

  if (appSlug === "whoop") {
    switch (category) {
      case "SLEEP":
        return transformWhoopSleep(dateStr, data);
      case "RECOVERY":
        return transformWhoopRecovery(dateStr, data);
      case "WORKOUT":
        return transformWhoopWorkout(dateStr, data);
      case "BODY":
        return transformWhoopBody(dateStr, data);
      case "HEART_RATE":
        return transformWhoopCycle(dateStr, data);
      default:
        return transformGeneric(appSlug, category, dateStr, data);
    }
  }

  if (appSlug === "apple-health") {
    switch (category) {
      case "SLEEP":
        return transformTerraSleep(dateStr, data);
      case "ACTIVITY":
        return transformTerraActivity(dateStr, data);
      case "BODY":
        return transformTerraBody(dateStr, data);
      case "APP_NUTRITION":
        return transformTerraNutrition(dateStr, data);
      case "HEART_RATE":
        return transformTerraHeartRate(dateStr, data);
      case "WORKOUT":
        return transformTerraWorkout(dateStr, data);
      default:
        return transformGeneric(appSlug, category, dateStr, data);
    }
  }

  return transformGeneric(appSlug, category, dateStr, data);
}

// ─── Oura Transformers ────────────────────────────────────────────

function transformOuraSleep(date: string, data: Record<string, unknown>): string {
  const lines: string[] = [`Sleep Summary for ${date} (Oura Ring)`];

  const score = data.score as number | null;
  if (score != null) lines.push(`Sleep score: ${score}/100.`);

  const contrib = data.contributors as Record<string, number | null> | undefined;
  if (contrib) {
    const parts: string[] = [];
    if (contrib.deep_sleep != null) parts.push(`deep sleep: ${contrib.deep_sleep}`);
    if (contrib.efficiency != null) parts.push(`efficiency: ${contrib.efficiency}`);
    if (contrib.latency != null) parts.push(`latency: ${contrib.latency}`);
    if (contrib.rem_sleep != null) parts.push(`REM sleep: ${contrib.rem_sleep}`);
    if (contrib.restfulness != null) parts.push(`restfulness: ${contrib.restfulness}`);
    if (contrib.timing != null) parts.push(`timing: ${contrib.timing}`);
    if (contrib.total_sleep != null) parts.push(`total sleep: ${contrib.total_sleep}`);
    if (parts.length) lines.push(`Contributors: ${parts.join(", ")}.`);
  }

  return lines.join("\n");
}

function transformOuraActivity(date: string, data: Record<string, unknown>): string {
  const lines: string[] = [`Activity Summary for ${date} (Oura Ring)`];

  const score = data.score as number | null;
  if (score != null) lines.push(`Activity score: ${score}/100.`);

  if (data.steps != null) lines.push(`Steps: ${num(data.steps)}.`);
  if (data.active_calories != null) lines.push(`Active calories: ${num(data.active_calories)} kcal.`);
  if (data.total_calories != null) lines.push(`Total calories: ${num(data.total_calories)} kcal.`);
  if (data.equivalent_walking_distance != null) {
    lines.push(`Walking distance: ${(Number(data.equivalent_walking_distance) / 1000).toFixed(1)} km.`);
  }

  const times: string[] = [];
  if (data.high_activity_time != null) times.push(`high: ${formatSeconds(data.high_activity_time)}`);
  if (data.medium_activity_time != null) times.push(`medium: ${formatSeconds(data.medium_activity_time)}`);
  if (data.low_activity_time != null) times.push(`low: ${formatSeconds(data.low_activity_time)}`);
  if (data.sedentary_time != null) times.push(`sedentary: ${formatSeconds(data.sedentary_time)}`);
  if (times.length) lines.push(`Activity time: ${times.join(", ")}.`);

  return lines.join("\n");
}

function transformOuraReadiness(date: string, data: Record<string, unknown>): string {
  const lines: string[] = [`Readiness Summary for ${date} (Oura Ring)`];

  const score = data.score as number | null;
  if (score != null) lines.push(`Readiness score: ${score}/100.`);

  if (data.temperature_deviation != null) {
    lines.push(`Temperature deviation: ${Number(data.temperature_deviation).toFixed(1)}°C.`);
  }

  const contrib = data.contributors as Record<string, number | null> | undefined;
  if (contrib) {
    const parts: string[] = [];
    if (contrib.activity_balance != null) parts.push(`activity balance: ${contrib.activity_balance}`);
    if (contrib.body_temperature != null) parts.push(`body temperature: ${contrib.body_temperature}`);
    if (contrib.hrv_balance != null) parts.push(`HRV balance: ${contrib.hrv_balance}`);
    if (contrib.previous_day_activity != null) parts.push(`previous day activity: ${contrib.previous_day_activity}`);
    if (contrib.previous_night != null) parts.push(`previous night: ${contrib.previous_night}`);
    if (contrib.recovery_index != null) parts.push(`recovery index: ${contrib.recovery_index}`);
    if (contrib.resting_heart_rate != null) parts.push(`resting heart rate: ${contrib.resting_heart_rate}`);
    if (contrib.sleep_balance != null) parts.push(`sleep balance: ${contrib.sleep_balance}`);
    if (parts.length) lines.push(`Contributors: ${parts.join(", ")}.`);
  }

  return lines.join("\n");
}

function transformOuraHeartRate(date: string, data: unknown): string {
  const lines: string[] = [`Heart Rate Data for ${date} (Oura Ring)`];

  if (!Array.isArray(data)) {
    lines.push("No heart rate samples available.");
    return lines.join("\n");
  }

  const samples = data as Array<{ bpm: number; source: string; timestamp: string }>;
  if (samples.length === 0) {
    lines.push("No heart rate samples recorded.");
    return lines.join("\n");
  }

  const bpms = samples.map((s) => s.bpm);
  const avg = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);
  const min = Math.min(...bpms);
  const max = Math.max(...bpms);

  lines.push(`Samples recorded: ${samples.length}.`);
  lines.push(`Average heart rate: ${avg} bpm.`);
  lines.push(`Min heart rate: ${min} bpm. Max heart rate: ${max} bpm.`);

  // Group by source
  const sources = new Set(samples.map((s) => s.source));
  if (sources.size > 0) lines.push(`Sources: ${[...sources].join(", ")}.`);

  return lines.join("\n");
}

// ─── WHOOP Transformers ───────────────────────────────────────────

function transformWhoopSleep(date: string, data: Record<string, unknown>): string {
  const lines: string[] = [`Sleep Summary for ${date} (WHOOP)`];

  const score = data.score as Record<string, unknown> | null;
  if (!score) {
    lines.push("Sleep data not yet scored.");
    return lines.join("\n");
  }

  const stages = score.stage_summary as Record<string, number> | undefined;
  if (stages) {
    lines.push(`Total in bed: ${formatMillis(stages.total_in_bed_time_milli)}.`);
    lines.push(`Total awake: ${formatMillis(stages.total_awake_time_milli)}.`);
    lines.push(`Light sleep: ${formatMillis(stages.total_light_sleep_time_milli)}.`);
    lines.push(`Deep (SWS): ${formatMillis(stages.total_slow_wave_sleep_time_milli)}.`);
    lines.push(`REM sleep: ${formatMillis(stages.total_rem_sleep_time_milli)}.`);
    if (stages.sleep_cycle_count) lines.push(`Sleep cycles: ${stages.sleep_cycle_count}.`);
    if (stages.disturbance_count) lines.push(`Disturbances: ${stages.disturbance_count}.`);
  }

  const needed = score.sleep_needed as Record<string, number> | undefined;
  if (needed) {
    lines.push(`Sleep needed (baseline): ${formatMillis(needed.baseline_milli)}.`);
    if (needed.need_from_sleep_debt_milli > 0) {
      lines.push(`Additional need from sleep debt: ${formatMillis(needed.need_from_sleep_debt_milli)}.`);
    }
  }

  if (score.respiratory_rate != null) {
    lines.push(`Respiratory rate: ${Number(score.respiratory_rate).toFixed(1)} breaths/min.`);
  }
  if (score.sleep_performance_percentage != null) {
    lines.push(`Sleep performance: ${score.sleep_performance_percentage}%.`);
  }
  if (score.sleep_efficiency_percentage != null) {
    lines.push(`Sleep efficiency: ${score.sleep_efficiency_percentage}%.`);
  }

  return lines.join("\n");
}

function transformWhoopRecovery(date: string, data: Record<string, unknown>): string {
  const lines: string[] = [`Recovery Summary for ${date} (WHOOP)`];

  const score = data.score as Record<string, unknown> | null;
  if (!score) {
    lines.push("Recovery data not yet scored.");
    return lines.join("\n");
  }

  if (score.recovery_score != null) {
    const pct = Number(score.recovery_score);
    const zone = pct >= 67 ? "green" : pct >= 34 ? "yellow" : "red";
    lines.push(`Recovery score: ${pct}% (${zone}).`);
  }
  if (score.resting_heart_rate != null) {
    lines.push(`Resting heart rate: ${score.resting_heart_rate} bpm.`);
  }
  if (score.hrv_rmssd_milli != null) {
    lines.push(`HRV (RMSSD): ${Number(score.hrv_rmssd_milli).toFixed(1)} ms.`);
  }
  if (score.spo2_percentage != null) {
    lines.push(`SpO2: ${score.spo2_percentage}%.`);
  }
  if (score.skin_temp_celsius != null) {
    lines.push(`Skin temperature: ${Number(score.skin_temp_celsius).toFixed(1)}°C.`);
  }
  if (score.user_calibrating) {
    lines.push("Note: User is still calibrating.");
  }

  return lines.join("\n");
}

function transformWhoopWorkout(date: string, data: Record<string, unknown>): string {
  const lines: string[] = [`Workout Summary for ${date} (WHOOP)`];

  if (data.sport_id != null) {
    lines.push(`Sport ID: ${data.sport_id}.`);
  }

  const startTime = data.start as string | undefined;
  const endTime = data.end as string | undefined;
  if (startTime && endTime) {
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    lines.push(`Duration: ${formatMillis(durationMs)}.`);
  }

  const score = data.score as Record<string, unknown> | null;
  if (!score) {
    lines.push("Workout data not yet scored.");
    return lines.join("\n");
  }

  if (score.strain != null) lines.push(`Strain: ${Number(score.strain).toFixed(1)}.`);
  if (score.average_heart_rate != null) lines.push(`Average heart rate: ${score.average_heart_rate} bpm.`);
  if (score.max_heart_rate != null) lines.push(`Max heart rate: ${score.max_heart_rate} bpm.`);
  if (score.kilojoule != null) {
    const kcal = Math.round(Number(score.kilojoule) / 4.184);
    lines.push(`Energy: ${kcal} kcal (${Number(score.kilojoule).toFixed(0)} kJ).`);
  }
  if (score.distance_meter != null) {
    lines.push(`Distance: ${(Number(score.distance_meter) / 1000).toFixed(2)} km.`);
  }

  const zones = score.zone_duration as Record<string, number> | undefined;
  if (zones) {
    const zoneParts: string[] = [];
    if (zones.zone_zero_milli) zoneParts.push(`Zone 0: ${formatMillis(zones.zone_zero_milli)}`);
    if (zones.zone_one_milli) zoneParts.push(`Zone 1: ${formatMillis(zones.zone_one_milli)}`);
    if (zones.zone_two_milli) zoneParts.push(`Zone 2: ${formatMillis(zones.zone_two_milli)}`);
    if (zones.zone_three_milli) zoneParts.push(`Zone 3: ${formatMillis(zones.zone_three_milli)}`);
    if (zones.zone_four_milli) zoneParts.push(`Zone 4: ${formatMillis(zones.zone_four_milli)}`);
    if (zones.zone_five_milli) zoneParts.push(`Zone 5: ${formatMillis(zones.zone_five_milli)}`);
    if (zoneParts.length) lines.push(`Heart rate zones: ${zoneParts.join(", ")}.`);
  }

  return lines.join("\n");
}

function transformWhoopBody(date: string, data: Record<string, unknown>): string {
  const lines: string[] = [`Body Measurements as of ${date} (WHOOP)`];

  if (data.height_meter != null) {
    const cm = (Number(data.height_meter) * 100).toFixed(1);
    lines.push(`Height: ${cm} cm.`);
  }
  if (data.weight_kilogram != null) {
    lines.push(`Weight: ${Number(data.weight_kilogram).toFixed(1)} kg.`);
  }
  if (data.max_heart_rate != null) {
    lines.push(`Max heart rate: ${data.max_heart_rate} bpm.`);
  }

  return lines.join("\n");
}

function transformWhoopCycle(date: string, data: Record<string, unknown>): string {
  const lines: string[] = [`Physiological Cycle for ${date} (WHOOP)`];

  const score = data.score as Record<string, unknown> | null;
  if (!score) {
    lines.push("Cycle data not yet scored.");
    return lines.join("\n");
  }

  if (score.strain != null) lines.push(`Day strain: ${Number(score.strain).toFixed(1)}.`);
  if (score.kilojoule != null) {
    const kcal = Math.round(Number(score.kilojoule) / 4.184);
    lines.push(`Total energy: ${kcal} kcal.`);
  }
  if (score.average_heart_rate != null) lines.push(`Average heart rate: ${score.average_heart_rate} bpm.`);
  if (score.max_heart_rate != null) lines.push(`Max heart rate: ${score.max_heart_rate} bpm.`);

  return lines.join("\n");
}

// ─── Apple Health (Terra) Transformers ─────────────────────────────

function transformTerraSleep(date: string, data: Record<string, unknown>): string {
  const lines: string[] = [`Sleep Summary for ${date} (Apple Health)`];

  const durations = data.sleep_durations_data as Record<string, unknown> | null;
  if (durations) {
    const asleep = durations.asleep as Record<string, number> | undefined;
    const awake = durations.awake as Record<string, number> | undefined;
    const other = durations.other as Record<string, number> | undefined;

    if (other?.duration_in_bed_seconds) {
      lines.push(`Time in bed: ${formatSeconds(other.duration_in_bed_seconds)}.`);
    }
    if (asleep) {
      if (asleep.duration_asleep_state_seconds) {
        lines.push(`Total sleep: ${formatSeconds(asleep.duration_asleep_state_seconds)}.`);
      }
      if (asleep.duration_deep_sleep_state_seconds) {
        lines.push(`Deep sleep: ${formatSeconds(asleep.duration_deep_sleep_state_seconds)}.`);
      }
      if (asleep.duration_light_sleep_state_seconds) {
        lines.push(`Light sleep: ${formatSeconds(asleep.duration_light_sleep_state_seconds)}.`);
      }
      if (asleep.duration_REM_sleep_state_seconds) {
        lines.push(`REM sleep: ${formatSeconds(asleep.duration_REM_sleep_state_seconds)}.`);
      }
    }
    if (awake?.duration_awake_state_seconds) {
      lines.push(`Time awake: ${formatSeconds(awake.duration_awake_state_seconds)}.`);
    }
  }

  const rating = data.sleep_rating_data as Record<string, number | null> | null;
  if (rating?.overall_sleep_rating != null) {
    lines.push(`Sleep rating: ${rating.overall_sleep_rating}.`);
  }

  const hr = data.heart_rate_data as Record<string, Record<string, number | null>> | null;
  if (hr?.summary) {
    if (hr.summary.resting_hr_bpm != null) lines.push(`Resting heart rate: ${hr.summary.resting_hr_bpm} bpm.`);
    if (hr.summary.avg_hr_bpm != null) lines.push(`Average heart rate during sleep: ${hr.summary.avg_hr_bpm} bpm.`);
  }

  const resp = data.respiration_data as Record<string, Record<string, number | null>> | null;
  if (resp?.breaths_data?.avg_breaths_per_min != null) {
    lines.push(`Respiratory rate: ${resp.breaths_data.avg_breaths_per_min} breaths/min.`);
  }

  return lines.join("\n");
}

function transformTerraActivity(date: string, data: Record<string, unknown>): string {
  const lines: string[] = [`Activity Summary for ${date} (Apple Health)`];

  const meta = data.metadata as Record<string, string | null> | undefined;
  if (meta?.name) lines.push(`Activity: ${meta.name}.`);

  const movement = data.movement_data as Record<string, Record<string, number | null>> | null;
  if (movement?.steps_data?.steps != null) {
    lines.push(`Steps: ${num(movement.steps_data.steps)}.`);
  }

  const calories = data.calories_data as Record<string, number | null> | null;
  if (calories) {
    if (calories.total_burned_calories != null) {
      lines.push(`Total calories burned: ${Math.round(calories.total_burned_calories)} kcal.`);
    }
    if (calories.net_activity_calories != null) {
      lines.push(`Active calories: ${Math.round(calories.net_activity_calories)} kcal.`);
    }
  }

  const distance = data.distance_data as Record<string, Record<string, number | null>> | null;
  if (distance?.summary?.distance_meters != null) {
    lines.push(`Distance: ${(distance.summary.distance_meters / 1000).toFixed(1)} km.`);
  }

  const durations = data.active_durations_data as Record<string, number | null> | null;
  if (durations) {
    const parts: string[] = [];
    if (durations.vigorous_intensity_seconds) parts.push(`vigorous: ${formatSeconds(durations.vigorous_intensity_seconds)}`);
    if (durations.moderate_intensity_seconds) parts.push(`moderate: ${formatSeconds(durations.moderate_intensity_seconds)}`);
    if (durations.low_intensity_seconds) parts.push(`low: ${formatSeconds(durations.low_intensity_seconds)}`);
    if (parts.length) lines.push(`Activity time: ${parts.join(", ")}.`);
  }

  const hr = data.heart_rate_data as Record<string, Record<string, number | null>> | null;
  if (hr?.summary) {
    if (hr.summary.avg_hr_bpm != null) lines.push(`Average heart rate: ${hr.summary.avg_hr_bpm} bpm.`);
    if (hr.summary.max_hr_bpm != null) lines.push(`Max heart rate: ${hr.summary.max_hr_bpm} bpm.`);
  }

  return lines.join("\n");
}

function transformTerraBody(date: string, data: Record<string, unknown>): string {
  const lines: string[] = [`Body Measurements as of ${date} (Apple Health)`];

  const measurements = data.measurements_data as Record<string, unknown[]> | null;
  if (measurements?.measurements && Array.isArray(measurements.measurements)) {
    const latest = measurements.measurements[measurements.measurements.length - 1] as Record<string, number | null> | undefined;
    if (latest) {
      if (latest.weight_kg != null) lines.push(`Weight: ${Number(latest.weight_kg).toFixed(1)} kg.`);
      if (latest.height_cm != null) lines.push(`Height: ${Number(latest.height_cm).toFixed(1)} cm.`);
      if (latest.BMI != null) lines.push(`BMI: ${Number(latest.BMI).toFixed(1)}.`);
      if (latest.body_fat_percentage != null) lines.push(`Body fat: ${Number(latest.body_fat_percentage).toFixed(1)}%.`);
    }
  }

  const heart = data.heart_data as Record<string, Record<string, Record<string, number | null>>> | null;
  if (heart?.heart_rate_data?.summary?.resting_hr_bpm != null) {
    lines.push(`Resting heart rate: ${heart.heart_rate_data.summary.resting_hr_bpm} bpm.`);
  }

  return lines.join("\n");
}

function transformTerraNutrition(date: string, data: Record<string, unknown>): string {
  const lines: string[] = [`Nutrition Summary for ${date} (Apple Health)`];

  const summary = data.summary as Record<string, unknown> | null;
  if (!summary) {
    lines.push("No nutrition data available.");
    return lines.join("\n");
  }

  const macros = summary.macros as Record<string, number | null> | undefined;
  if (macros) {
    if (macros.calories != null) lines.push(`Calories: ${Math.round(macros.calories)} kcal.`);
    if (macros.protein_g != null) lines.push(`Protein: ${Number(macros.protein_g).toFixed(0)}g.`);
    if (macros.fat_g != null) lines.push(`Fat: ${Number(macros.fat_g).toFixed(0)}g.`);
    if (macros.carbohydrates_g != null) lines.push(`Carbs: ${Number(macros.carbohydrates_g).toFixed(0)}g.`);
    if (macros.fiber_g != null) lines.push(`Fiber: ${Number(macros.fiber_g).toFixed(0)}g.`);
    if (macros.sugar_g != null) lines.push(`Sugar: ${Number(macros.sugar_g).toFixed(0)}g.`);
  }

  if (summary.water_ml != null) {
    lines.push(`Water: ${Math.round(Number(summary.water_ml))} ml.`);
  }

  return lines.join("\n");
}

function transformTerraHeartRate(date: string, data: Record<string, unknown>): string {
  const lines: string[] = [`Heart Rate Data for ${date} (Apple Health)`];

  const hr = data.heart_rate_data as Record<string, Record<string, number | null>> | null;
  if (hr?.summary) {
    if (hr.summary.resting_hr_bpm != null) lines.push(`Resting heart rate: ${hr.summary.resting_hr_bpm} bpm.`);
    if (hr.summary.avg_hr_bpm != null) lines.push(`Average heart rate: ${hr.summary.avg_hr_bpm} bpm.`);
    if (hr.summary.min_hr_bpm != null) lines.push(`Min heart rate: ${hr.summary.min_hr_bpm} bpm.`);
    if (hr.summary.max_hr_bpm != null) lines.push(`Max heart rate: ${hr.summary.max_hr_bpm} bpm.`);
  } else {
    lines.push("No heart rate summary available.");
  }

  return lines.join("\n");
}

function transformTerraWorkout(date: string, data: Record<string, unknown>): string {
  const lines: string[] = [`Workout Summary for ${date} (Apple Health)`];

  const meta = data.metadata as Record<string, string | null> | undefined;
  if (meta?.name) lines.push(`Workout: ${meta.name}.`);
  if (meta?.type) lines.push(`Type: ${meta.type}.`);

  if (meta?.start_time && meta?.end_time) {
    const durationMs = new Date(meta.end_time).getTime() - new Date(meta.start_time).getTime();
    if (durationMs > 0) lines.push(`Duration: ${formatMillis(durationMs)}.`);
  }

  const calories = data.calories_data as Record<string, number | null> | null;
  if (calories?.total_burned_calories != null) {
    lines.push(`Calories burned: ${Math.round(calories.total_burned_calories)} kcal.`);
  }

  const distance = data.distance_data as Record<string, Record<string, number | null>> | null;
  if (distance?.summary?.distance_meters != null) {
    lines.push(`Distance: ${(distance.summary.distance_meters / 1000).toFixed(2)} km.`);
  }

  const hr = data.heart_rate_data as Record<string, Record<string, number | null>> | null;
  if (hr?.summary) {
    if (hr.summary.avg_hr_bpm != null) lines.push(`Average heart rate: ${hr.summary.avg_hr_bpm} bpm.`);
    if (hr.summary.max_hr_bpm != null) lines.push(`Max heart rate: ${hr.summary.max_hr_bpm} bpm.`);
  }

  return lines.join("\n");
}

// ─── Generic Fallback ─────────────────────────────────────────────

function transformGeneric(
  appSlug: string,
  category: string,
  date: string,
  data: Record<string, unknown>
): string {
  const lines: string[] = [`${category} Data for ${date} (${appSlug})`];

  for (const [key, value] of Object.entries(data)) {
    if (value == null) continue;
    if (typeof value === "object") {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  return lines.join("\n");
}

// ─── Formatting Helpers ───────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatMillis(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatSeconds(sec: unknown): string {
  const s = Number(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function num(v: unknown): string {
  return Number(v).toLocaleString();
}

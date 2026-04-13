import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { getValidAccessToken } from "@/lib/apps/token-refresh";
import { decrypt } from "@/lib/encryption";
import { OuraService } from "@/lib/services/oura";
import { WhoopService } from "@/lib/services/whoop";
import { TerraService } from "@/lib/services/terra";
import type { KnowledgeAppDataCategory } from "@prisma/client";
import { transformDataPoint } from "@/lib/apps/data-transformer";

/**
 * POST — Sync data from the connected app.
 * Fetches data for each enabled category and upserts KnowledgeAppDataPoint records.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const app = await prisma.knowledgeApp.findUnique({ where: { id } });
    if (!app) return apiError("App not found", 404);
    if (!app.credentials) return apiError("App not connected", 400);

    // Update status to PROCESSING while syncing
    await prisma.knowledgeApp.update({
      where: { id },
      data: { status: "PROCESSING", errorMessage: null },
    });

    // Determine date range
    const endDate = new Date();
    let startDate: Date;
    if (app.lastSyncAt) {
      // Sync from last sync minus 1 day overlap (to catch late-arriving data)
      startDate = new Date(app.lastSyncAt);
      startDate.setDate(startDate.getDate() - 1);
    } else if (app.syncStartDate) {
      startDate = new Date(app.syncStartDate);
    } else {
      // Default: last 30 days for first sync
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    let totalRecords = 0;
    const errors: string[] = [];

    if (app.slug === "oura" || app.slug === "whoop") {
      const accessToken = await getValidAccessToken(id);
      if (app.slug === "oura") {
        totalRecords = await syncOura(accessToken, id, app.dataCategories, startStr, endStr, errors);
      } else {
        totalRecords = await syncWhoop(accessToken, id, app.dataCategories, startStr, endStr, errors);
      }
    } else if (app.slug === "apple-health") {
      totalRecords = await syncAppleHealth(app.credentials!, id, app.dataCategories, startStr, endStr, errors);
    } else {
      await prisma.knowledgeApp.update({
        where: { id },
        data: { status: "READY" },
      });
      return apiError(`Sync not implemented for: ${app.slug}`, 400);
    }

    // Update app status
    const hasErrors = errors.length > 0;
    await prisma.knowledgeApp.update({
      where: { id },
      data: {
        status: totalRecords > 0 || !hasErrors ? "READY" : "ERROR",
        lastSyncAt: new Date(),
        errorMessage: hasErrors ? errors.join("; ").slice(0, 500) : null,
      },
    });

    const details = `Synced ${totalRecords} data points from ${startStr} to ${endStr}${hasErrors ? ` (${errors.length} errors)` : ""}`;

    await prisma.knowledgeAppSyncLog.create({
      data: {
        appId: id,
        action: "sync",
        status: hasErrors ? "error" : "success",
        details,
        recordsProcessed: totalRecords,
        syncedFrom: startDate,
        syncedTo: endDate,
      },
    });

    // Fire-and-forget: process all PENDING data points into textContent
    if (totalRecords > 0) {
      processDataPoints(id, app.slug).catch((err) =>
        console.error("Background data processing failed:", err)
      );
    }

    return apiSuccess({ recordsProcessed: totalRecords, details });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    console.error("POST /api/knowledge/apps/[id]/sync error:", e);

    try {
      await prisma.knowledgeApp.update({
        where: { id },
        data: { status: "ERROR", errorMessage: message.slice(0, 500) },
      });
      await prisma.knowledgeAppSyncLog.create({
        data: {
          appId: id,
          action: "sync",
          status: "error",
          details: message.slice(0, 500),
        },
      });
    } catch {}

    return apiError(message, 500);
  }
}

// ─── Oura Sync ────────────────────────────────────────────────────

async function syncOura(
  accessToken: string,
  appId: string,
  categories: string[],
  startDate: string,
  endDate: string,
  errors: string[]
): Promise<number> {
  const svc = new OuraService(accessToken);
  let count = 0;

  if (categories.includes("SLEEP")) {
    try {
      const data = await svc.getDailySleep(startDate, endDate);
      for (const item of data) {
        await upsertDataPoint(appId, "SLEEP", item.day, item);
        count++;
      }
    } catch (e) {
      errors.push(`SLEEP: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (categories.includes("ACTIVITY")) {
    try {
      const data = await svc.getDailyActivity(startDate, endDate);
      for (const item of data) {
        await upsertDataPoint(appId, "ACTIVITY", item.day, item);
        count++;
      }
    } catch (e) {
      errors.push(`ACTIVITY: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (categories.includes("READINESS")) {
    try {
      const data = await svc.getDailyReadiness(startDate, endDate);
      for (const item of data) {
        await upsertDataPoint(appId, "READINESS", item.day, item);
        count++;
      }
    } catch (e) {
      errors.push(`READINESS: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (categories.includes("HEART_RATE")) {
    try {
      const data = await svc.getHeartRate(startDate, endDate);
      // Group heart rate data by day
      const byDay = new Map<string, typeof data>();
      for (const hr of data) {
        const day = hr.timestamp.split("T")[0];
        const existing = byDay.get(day) ?? [];
        existing.push(hr);
        byDay.set(day, existing);
      }
      for (const [day, records] of byDay) {
        await upsertDataPoint(appId, "HEART_RATE", day, records);
        count++;
      }
    } catch (e) {
      errors.push(`HEART_RATE: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  return count;
}

// ─── WHOOP Sync ───────────────────────────────────────────────────

async function syncWhoop(
  accessToken: string,
  appId: string,
  categories: string[],
  startDate: string,
  endDate: string,
  errors: string[]
): Promise<number> {
  const svc = new WhoopService(accessToken);
  let count = 0;

  if (categories.includes("SLEEP")) {
    try {
      const data = await svc.getSleep(startDate, endDate);
      for (const item of data) {
        const day = item.start.split("T")[0];
        await upsertDataPoint(appId, "SLEEP", day, item);
        count++;
      }
    } catch (e) {
      errors.push(`SLEEP: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (categories.includes("RECOVERY")) {
    try {
      const data = await svc.getRecovery(startDate, endDate);
      for (const item of data) {
        const day = item.created_at.split("T")[0];
        await upsertDataPoint(appId, "RECOVERY", day, item);
        count++;
      }
    } catch (e) {
      errors.push(`RECOVERY: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (categories.includes("WORKOUT")) {
    try {
      const data = await svc.getWorkouts(startDate, endDate);
      for (const item of data) {
        const day = item.start.split("T")[0];
        await upsertDataPoint(appId, "WORKOUT", day, item);
        count++;
      }
    } catch (e) {
      errors.push(`WORKOUT: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (categories.includes("BODY")) {
    try {
      const data = await svc.getBodyMeasurements();
      const today = new Date().toISOString().split("T")[0];
      await upsertDataPoint(appId, "BODY", today, data);
      count++;
    } catch (e) {
      errors.push(`BODY: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  // WHOOP cycles map to ACTIVITY (strain/kilojoule data)
  if (categories.includes("HEART_RATE")) {
    try {
      const cycles = await svc.getCycles(startDate, endDate);
      for (const item of cycles) {
        const day = item.start.split("T")[0];
        await upsertDataPoint(appId, "HEART_RATE", day, item);
        count++;
      }
    } catch (e) {
      errors.push(`HEART_RATE: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  return count;
}

// ─── Apple Health (Terra) Sync ────────────────────────────────────

async function syncAppleHealth(
  encryptedCredentials: string,
  appId: string,
  categories: string[],
  startDate: string,
  endDate: string,
  errors: string[]
): Promise<number> {
  const devId = process.env.TERRA_DEV_ID;
  const apiKey = process.env.TERRA_API_KEY;
  if (!devId || !apiKey) throw new Error("TERRA_DEV_ID / TERRA_API_KEY not configured");

  const creds = JSON.parse(decrypt(encryptedCredentials)) as { terraUserId: string };
  const terra = new TerraService(devId, apiKey);
  let count = 0;

  if (categories.includes("SLEEP")) {
    try {
      const data = await terra.getSleep(creds.terraUserId, startDate, endDate);
      for (const item of data) {
        const day = (item.metadata?.start_time || item.start_time)?.split("T")[0];
        if (day) { await upsertDataPoint(appId, "SLEEP", day, item); count++; }
      }
    } catch (e) {
      errors.push(`SLEEP: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (categories.includes("ACTIVITY")) {
    try {
      const data = await terra.getActivity(creds.terraUserId, startDate, endDate);
      for (const item of data) {
        const day = item.metadata?.start_time?.split("T")[0];
        if (day) { await upsertDataPoint(appId, "ACTIVITY", day, item); count++; }
      }
    } catch (e) {
      errors.push(`ACTIVITY: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (categories.includes("HEART_RATE")) {
    try {
      // Terra body endpoint includes heart rate summary data
      const data = await terra.getBody(creds.terraUserId, startDate, endDate);
      for (const item of data) {
        const day = item.metadata?.start_time?.split("T")[0];
        if (day) { await upsertDataPoint(appId, "HEART_RATE", day, item); count++; }
      }
    } catch (e) {
      errors.push(`HEART_RATE: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (categories.includes("WORKOUT")) {
    try {
      // Terra activity endpoint includes workout data
      const data = await terra.getActivity(creds.terraUserId, startDate, endDate);
      for (const item of data) {
        if (item.metadata?.type && item.metadata.type !== "unknown") {
          const day = item.metadata.start_time?.split("T")[0];
          if (day) { await upsertDataPoint(appId, "WORKOUT", day, item); count++; }
        }
      }
    } catch (e) {
      errors.push(`WORKOUT: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (categories.includes("BODY")) {
    try {
      const data = await terra.getBody(creds.terraUserId, startDate, endDate);
      for (const item of data) {
        const day = item.metadata?.start_time?.split("T")[0];
        if (day) { await upsertDataPoint(appId, "BODY", day, item); count++; }
      }
    } catch (e) {
      errors.push(`BODY: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  if (categories.includes("APP_NUTRITION")) {
    try {
      const data = await terra.getNutrition(creds.terraUserId, startDate, endDate);
      for (const item of data) {
        const day = item.metadata?.start_time?.split("T")[0];
        if (day) { await upsertDataPoint(appId, "APP_NUTRITION", day, item); count++; }
      }
    } catch (e) {
      errors.push(`APP_NUTRITION: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  return count;
}

// ─── Helpers ──────────────────────────────────────────────────────

async function processDataPoints(appId: string, appSlug: string): Promise<void> {
  const pending = await prisma.knowledgeAppDataPoint.findMany({
    where: { appId, status: "PENDING" },
    orderBy: { date: "asc" },
  });

  for (const dp of pending) {
    try {
      const textContent = transformDataPoint(appSlug, dp.category, dp.date, dp.rawData);
      await prisma.knowledgeAppDataPoint.update({
        where: { id: dp.id },
        data: {
          status: "READY",
          textContent,
          chunkCount: Math.ceil(textContent.length / 1000),
          processedAt: new Date(),
          errorMessage: null,
        },
      });
    } catch (err) {
      await prisma.knowledgeAppDataPoint.update({
        where: { id: dp.id },
        data: {
          status: "ERROR",
          errorMessage: err instanceof Error ? err.message : "Transform failed",
        },
      });
    }
  }
}

async function upsertDataPoint(
  appId: string,
  category: string,
  dateStr: string,
  rawData: unknown
): Promise<void> {
  const date = new Date(dateStr + "T00:00:00.000Z");

  await prisma.knowledgeAppDataPoint.upsert({
    where: {
      appId_category_date: {
        appId,
        category: category as KnowledgeAppDataCategory,
        date,
      },
    },
    create: {
      appId,
      category: category as KnowledgeAppDataCategory,
      date,
      rawData: rawData as any,
      status: "PENDING",
    },
    update: {
      rawData: rawData as any,
      status: "PENDING",
      textContent: null,
      processedAt: null,
    },
  });
}

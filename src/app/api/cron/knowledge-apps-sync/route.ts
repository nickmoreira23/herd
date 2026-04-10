import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/knowledge/token-refresh";
import { decrypt } from "@/lib/encryption";
import { OuraService } from "@/lib/services/oura";
import { WhoopService } from "@/lib/services/whoop";
import { TerraService } from "@/lib/services/terra";
import type { KnowledgeAppDataCategory } from "@prisma/client";
import { transformDataPoint } from "@/lib/knowledge/data-transformer";

/**
 * GET — Scheduled sync for all connected Knowledge Apps.
 *
 * Runs on a schedule (e.g., Vercel Cron). Checks each connected app's
 * syncFrequencyMin to determine if it's due for a sync.
 *
 * Protected by CRON_SECRET header to prevent unauthorized access.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: Array<{ appId: string; slug: string; status: string; records?: number; error?: string }> = [];

  // Find all connected apps that are due for sync
  const apps = await prisma.knowledgeApp.findMany({
    where: {
      status: { in: ["READY", "ERROR"] },
      isActive: true,
      credentials: { not: null },
    },
  });

  for (const app of apps) {
    // Check if sync is due based on frequency
    if (app.lastSyncAt) {
      const nextSyncAt = new Date(app.lastSyncAt.getTime() + app.syncFrequencyMin * 60000);
      if (nextSyncAt > now) {
        continue; // Not due yet
      }
    }

    try {
      const recordCount = await syncApp(app);
      results.push({ appId: app.id, slug: app.slug, status: "success", records: recordCount });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Sync failed";
      results.push({ appId: app.id, slug: app.slug, status: "error", error: message });

      await prisma.knowledgeApp.update({
        where: { id: app.id },
        data: { status: "ERROR", errorMessage: message.slice(0, 500) },
      });

      await prisma.knowledgeAppSyncLog.create({
        data: {
          appId: app.id,
          action: "cron_sync",
          status: "error",
          details: message.slice(0, 500),
        },
      });
    }
  }

  return NextResponse.json({
    synced: results.filter((r) => r.status === "success").length,
    errors: results.filter((r) => r.status === "error").length,
    skipped: apps.length - results.length,
    results,
  });
}

async function syncApp(
  app: { id: string; slug: string; credentials: string | null; dataCategories: string[]; lastSyncAt: Date | null; syncStartDate: Date | null }
): Promise<number> {
  if (!app.credentials) throw new Error("No credentials");

  await prisma.knowledgeApp.update({
    where: { id: app.id },
    data: { status: "PROCESSING", errorMessage: null },
  });

  // Determine date range
  const endDate = new Date();
  let startDate: Date;
  if (app.lastSyncAt) {
    startDate = new Date(app.lastSyncAt);
    startDate.setDate(startDate.getDate() - 1);
  } else if (app.syncStartDate) {
    startDate = new Date(app.syncStartDate);
  } else {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  }

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];
  const errors: string[] = [];
  let totalRecords = 0;

  if (app.slug === "oura" || app.slug === "whoop") {
    const accessToken = await getValidAccessToken(app.id);
    if (app.slug === "oura") {
      totalRecords = await syncOuraData(accessToken, app.id, app.dataCategories, startStr, endStr, errors);
    } else {
      totalRecords = await syncWhoopData(accessToken, app.id, app.dataCategories, startStr, endStr, errors);
    }
  } else if (app.slug === "apple-health") {
    totalRecords = await syncAppleHealthData(app.credentials, app.id, app.dataCategories, startStr, endStr, errors);
  }

  // Process data points
  await processAllPending(app.id, app.slug);

  // Update status
  const hasErrors = errors.length > 0;
  await prisma.knowledgeApp.update({
    where: { id: app.id },
    data: {
      status: totalRecords > 0 || !hasErrors ? "READY" : "ERROR",
      lastSyncAt: new Date(),
      errorMessage: hasErrors ? errors.join("; ").slice(0, 500) : null,
    },
  });

  await prisma.knowledgeAppSyncLog.create({
    data: {
      appId: app.id,
      action: "cron_sync",
      status: hasErrors ? "error" : "success",
      details: `Cron synced ${totalRecords} data points (${startStr} to ${endStr})`,
      recordsProcessed: totalRecords,
      syncedFrom: startDate,
      syncedTo: endDate,
    },
  });

  return totalRecords;
}

// ─── App-specific sync helpers ────────────────────────────────────

async function syncOuraData(
  accessToken: string, appId: string, categories: string[],
  startDate: string, endDate: string, errors: string[]
): Promise<number> {
  const svc = new OuraService(accessToken);
  let count = 0;

  for (const cat of ["SLEEP", "ACTIVITY", "READINESS", "HEART_RATE"]) {
    if (!categories.includes(cat)) continue;
    try {
      if (cat === "SLEEP") {
        const data = await svc.getDailySleep(startDate, endDate);
        for (const item of data) { await upsert(appId, cat, item.day, item); count++; }
      } else if (cat === "ACTIVITY") {
        const data = await svc.getDailyActivity(startDate, endDate);
        for (const item of data) { await upsert(appId, cat, item.day, item); count++; }
      } else if (cat === "READINESS") {
        const data = await svc.getDailyReadiness(startDate, endDate);
        for (const item of data) { await upsert(appId, cat, item.day, item); count++; }
      } else if (cat === "HEART_RATE") {
        const data = await svc.getHeartRate(startDate, endDate);
        const byDay = new Map<string, typeof data>();
        for (const hr of data) {
          const day = hr.timestamp.split("T")[0];
          const arr = byDay.get(day) ?? [];
          arr.push(hr);
          byDay.set(day, arr);
        }
        for (const [day, records] of byDay) { await upsert(appId, cat, day, records); count++; }
      }
    } catch (e) {
      errors.push(`${cat}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  return count;
}

async function syncWhoopData(
  accessToken: string, appId: string, categories: string[],
  startDate: string, endDate: string, errors: string[]
): Promise<number> {
  const svc = new WhoopService(accessToken);
  let count = 0;

  for (const cat of ["SLEEP", "RECOVERY", "WORKOUT", "BODY", "HEART_RATE"]) {
    if (!categories.includes(cat)) continue;
    try {
      if (cat === "SLEEP") {
        const data = await svc.getSleep(startDate, endDate);
        for (const item of data) { await upsert(appId, cat, item.start.split("T")[0], item); count++; }
      } else if (cat === "RECOVERY") {
        const data = await svc.getRecovery(startDate, endDate);
        for (const item of data) { await upsert(appId, cat, item.created_at.split("T")[0], item); count++; }
      } else if (cat === "WORKOUT") {
        const data = await svc.getWorkouts(startDate, endDate);
        for (const item of data) { await upsert(appId, cat, item.start.split("T")[0], item); count++; }
      } else if (cat === "BODY") {
        const data = await svc.getBodyMeasurements();
        await upsert(appId, cat, new Date().toISOString().split("T")[0], data);
        count++;
      } else if (cat === "HEART_RATE") {
        const cycles = await svc.getCycles(startDate, endDate);
        for (const item of cycles) { await upsert(appId, cat, item.start.split("T")[0], item); count++; }
      }
    } catch (e) {
      errors.push(`${cat}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  return count;
}

async function syncAppleHealthData(
  encryptedCreds: string, appId: string, categories: string[],
  startDate: string, endDate: string, errors: string[]
): Promise<number> {
  const devId = process.env.TERRA_DEV_ID;
  const apiKey = process.env.TERRA_API_KEY;
  if (!devId || !apiKey) throw new Error("TERRA_DEV_ID / TERRA_API_KEY not configured");

  const creds = JSON.parse(decrypt(encryptedCreds)) as { terraUserId: string };
  const terra = new TerraService(devId, apiKey);
  let count = 0;

  for (const cat of ["SLEEP", "ACTIVITY", "BODY", "APP_NUTRITION", "HEART_RATE", "WORKOUT"]) {
    if (!categories.includes(cat)) continue;
    try {
      if (cat === "SLEEP") {
        const data = await terra.getSleep(creds.terraUserId, startDate, endDate);
        for (const item of data) {
          const day = (item.metadata?.start_time || item.start_time)?.split("T")[0];
          if (day) { await upsert(appId, cat, day, item); count++; }
        }
      } else if (cat === "ACTIVITY" || cat === "WORKOUT") {
        const data = await terra.getActivity(creds.terraUserId, startDate, endDate);
        for (const item of data) {
          const day = item.metadata?.start_time?.split("T")[0];
          if (day) { await upsert(appId, cat, day, item); count++; }
        }
      } else if (cat === "BODY" || cat === "HEART_RATE") {
        const data = await terra.getBody(creds.terraUserId, startDate, endDate);
        for (const item of data) {
          const day = item.metadata?.start_time?.split("T")[0];
          if (day) { await upsert(appId, cat, day, item); count++; }
        }
      } else if (cat === "APP_NUTRITION") {
        const data = await terra.getNutrition(creds.terraUserId, startDate, endDate);
        for (const item of data) {
          const day = item.metadata?.start_time?.split("T")[0];
          if (day) { await upsert(appId, cat, day, item); count++; }
        }
      }
    } catch (e) {
      errors.push(`${cat}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  return count;
}

// ─── Shared helpers ───────────────────────────────────────────────

async function upsert(appId: string, category: string, dateStr: string, rawData: unknown): Promise<void> {
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

async function processAllPending(appId: string, appSlug: string): Promise<void> {
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

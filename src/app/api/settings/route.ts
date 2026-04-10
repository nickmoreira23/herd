import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { key: "asc" },
    });
    // Return as key-value map
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = String(s.value ?? "");
    }
    return apiSuccess(map);
  } catch (e) {
    console.error("GET /api/settings error:", e);
    return apiError("Failed to fetch settings", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null) {
      return apiError("Expected object of key-value pairs", 400);
    }

    const entries = Object.entries(body as Record<string, string>);
    await Promise.all(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    return apiSuccess({ updated: entries.length });
  } catch (e) {
    console.error("PATCH /api/settings error:", e);
    return apiError("Failed to update settings", 500);
  }
}

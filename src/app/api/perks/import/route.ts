import { apiSuccess, apiError } from "@/lib/api-utils";
import { perkConfig } from "@/lib/import-export/entity-config";
import { parseImportWorkbook, executePartialUpdates } from "@/lib/import-export/import-utils";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return apiError("No file uploaded", 400);

    const buffer = new Uint8Array(await file.arrayBuffer());
    const parsed = await parseImportWorkbook(perkConfig, buffer);

    if (parsed.errors.length > 0 && parsed.rows.length === 0) {
      return apiError(parsed.errors.join("; "), 400);
    }

    const result = await executePartialUpdates(perkConfig, parsed.rows);
    return apiSuccess({ ...result, parseErrors: parsed.errors, detectedColumns: parsed.detectedColumns });
  } catch (e) {
    console.error("POST /api/perks/import error:", e);
    return apiError("Failed to import perks", 500);
  }
}

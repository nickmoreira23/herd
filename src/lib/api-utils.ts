import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod/v4";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(message: string, status = 400, details?: unknown, code?: string) {
  // `code` is a stable machine identifier the UI maps to an i18n key (never the
  // prose). Omitted from the body when not provided (back-compat).
  return NextResponse.json({ error: message, details, code }, { status });
}

export async function parseAndValidate<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        error: apiError("Validation failed", 400, e.issues),
      };
    }
    return {
      error: apiError("Invalid request body", 400),
    };
  }
}

import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
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

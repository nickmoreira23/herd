import { NextRequest } from "next/server";
import {
  getAccountStatement,
  serializeAccountStatement,
  AccountNotFoundError,
  StatementLimitExceededError,
  InvalidCursorError,
} from "@/lib/ledger";
import { apiError, apiSuccess } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? parseInt(limitRaw, 10) : undefined;

  try {
    const statement = await getAccountStatement({
      accountCode: decodedCode,
      cursor,
      limit,
    });
    return apiSuccess(serializeAccountStatement(statement));
  } catch (e) {
    if (e instanceof AccountNotFoundError) {
      return apiError("Account not found", 404);
    }
    if (e instanceof StatementLimitExceededError) {
      return apiError(e.message, 400);
    }
    if (e instanceof InvalidCursorError) {
      return apiError(e.message, 400);
    }
    throw e;
  }
}

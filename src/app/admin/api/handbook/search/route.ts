import { NextRequest, NextResponse } from "next/server";
import { getIndex } from "@/lib/handbook/search-index";
import { searchEntries } from "@/lib/handbook/search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const localeParam = searchParams.get("locale") ?? "pt-BR";
  const limitParam = searchParams.get("limit");

  const locale: "pt-BR" | "en-US" =
    localeParam === "en-US" ? "en-US" : "pt-BR";
  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  const entries = getIndex();
  const results = searchEntries(entries, q, { locale, limit });

  return NextResponse.json({ results });
}

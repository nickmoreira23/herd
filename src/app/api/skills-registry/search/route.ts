import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const limit = request.nextUrl.searchParams.get("limit") || "20";

  try {
    const url = new URL("https://skills.sh/api/search");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", limit);

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Skills registry unavailable" },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from skills registry" },
      { status: 502 }
    );
  }
}

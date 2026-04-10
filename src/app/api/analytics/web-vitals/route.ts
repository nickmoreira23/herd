import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value, id, pageSlug } = body;

    // Log the web vital metric (could be stored in DB for dashboards)
    console.log(
      `[WebVital] ${name}=${Math.round(value)} id=${id} page=/p/${pageSlug}`
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

import { execSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { NextResponse } from "next/server";

// TEMPORARY ENDPOINT — DELETE AFTER MIGRATION
// Accepts a .tar.gz upload and extracts it to public/uploads/

const RESTORE_SECRET = "herd-migrate-2026-temp";

export async function POST(request: Request) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${RESTORE_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("application/gzip") && !contentType.includes("application/octet-stream")) {
      return NextResponse.json({ error: "Expected application/gzip or application/octet-stream" }, { status: 400 });
    }

    const body = await request.arrayBuffer();
    const buffer = Buffer.from(body);

    // Write tarball to temp location
    const tmpPath = "/tmp/restore-uploads.tar.gz";
    writeFileSync(tmpPath, buffer);

    // Ensure target directory exists
    const uploadsDir = process.cwd() + "/public/uploads";
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Extract tarball
    execSync(`tar -xzf ${tmpPath} -C ${process.cwd()}/public/`, { timeout: 120000 });

    // Clean up temp file
    execSync(`rm -f ${tmpPath}`);

    // List what was extracted
    const result = execSync(`find ${uploadsDir} -type f | wc -l`).toString().trim();

    return NextResponse.json({
      success: true,
      message: `Extracted uploads. Total files: ${result}`,
      size: buffer.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${RESTORE_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const uploadsDir = process.cwd() + "/public/uploads";
    const result = execSync(`find ${uploadsDir} -type f 2>/dev/null || echo "No uploads directory"`).toString().trim();
    const count = execSync(`find ${uploadsDir} -type f 2>/dev/null | wc -l`).toString().trim();
    const size = execSync(`du -sh ${uploadsDir} 2>/dev/null || echo "0"`).toString().trim();

    return NextResponse.json({
      files: result.split("\n").filter(Boolean),
      count: parseInt(count),
      size,
    });
  } catch {
    return NextResponse.json({ files: [], count: 0, size: "0" });
  }
}

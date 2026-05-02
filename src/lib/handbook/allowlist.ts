import { readFileSync } from "node:fs";
import { join } from "node:path";

interface AllowlistEntry {
  fromUid: string;
  field: string;
  danglingUid: string;
}

let cached: AllowlistEntry[] | null = null;

/**
 * Parse the legacy allowlist file.
 * Format: <from-uid>:<field>:<dangling-uid>  (colon-separated)
 *
 * Note: from-uid contains dots (e.g. herd.block.miscellaneous.meetings),
 * so we split on `:`, not on `.`. The middle segment is always the field.
 */
export function getAllowlist(): AllowlistEntry[] {
  if (cached) return cached;

  const path = join(process.cwd(), "docs/handbook/_meta/.legacy-allowlist.txt");
  let content: string;
  try {
    content = readFileSync(path, "utf-8");
  } catch {
    cached = [];
    return cached;
  }

  const entries: AllowlistEntry[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const parts = trimmed.split(":");
    if (parts.length !== 3) continue;
    entries.push({
      fromUid: parts[0],
      field: parts[1],
      danglingUid: parts[2],
    });
  }

  cached = entries;
  return cached;
}

export function isAllowlisted(
  fromUid: string,
  field: "consumes" | "consumed_by" | "related",
  toUid: string,
): boolean {
  return getAllowlist().some(
    (e) => e.fromUid === fromUid && e.field === field && e.danglingUid === toUid,
  );
}

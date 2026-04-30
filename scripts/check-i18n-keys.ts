import "dotenv/config";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Validates that every translation key used in the codebase via t("...") or
 * derived translator calls (e.g. tr("...") from `const tr = useT()`) exists
 * in src/lib/i18n/messages/pt-BR.ts (the source of truth for the MessageKey
 * type).
 *
 * Exit codes:
 *   0 — all keys are present.
 *   1 — one or more keys are missing.
 *   2 — script error (e.g., source file unreadable).
 */

function walk(dir: string, ignoreSegments: string[] = []): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (ignoreSegments.includes(entry)) continue;
    const full = path.join(dir, entry);
    let stats;
    try {
      stats = statSync(full);
    } catch {
      continue;
    }
    if (stats.isDirectory()) {
      out.push(...walk(full, ignoreSegments));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  // Read pt-BR dictionary as the source of truth.
  let dictSource: string;
  try {
    dictSource = readFileSync("src/lib/i18n/messages/pt-BR.ts", "utf-8");
  } catch (e) {
    console.error("[check-i18n-keys] Cannot read pt-BR.ts:", e);
    process.exit(2);
  }

  // Extract keys from the dictionary. Pattern matches lines like:
  //   "ledger.accounts.list.empty_state": "...",
  const dictKeyRegex = /^\s*['"]([\w.]+)['"]\s*:/gm;
  const dictKeys = new Set<string>();
  let match;
  while ((match = dictKeyRegex.exec(dictSource)) !== null) {
    dictKeys.add(match[1]);
  }

  if (dictKeys.size === 0) {
    console.error("[check-i18n-keys] Could not parse keys from pt-BR.ts");
    process.exit(2);
  }

  console.log(`[check-i18n-keys] ${dictKeys.size} keys defined in pt-BR.ts`);

  // Walk source files looking for t("...") or derived translator calls.
  const files = walk("src", ["__tests__", "node_modules", ".next"]).filter(
    (f) =>
      !f.endsWith(".test.ts") &&
      !f.endsWith(".test.tsx") &&
      !f.includes("/messages/") &&
      !f.includes(path.sep + "messages" + path.sep),
  );

  // Capture first-arg string literal of t() and useT()-derived translator calls.
  // Patterns:
  //   t("some.key")
  //   t("some.key", ...)
  //   useT()("some.key")
  //   const tr = useT(); tr("some.key")
  // We look for the simpler patterns; complex usages may need the file
  // re-checked manually.
  const callRegex = /\b(?:t|tr)\(\s*['"]([\w.]+)['"]/g;

  const usedKeys = new Set<string>();
  const usagesByKey = new Map<string, string[]>();

  for (const file of files) {
    let source: string;
    try {
      source = readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    while ((match = callRegex.exec(source)) !== null) {
      const key = match[1];
      // Skip non-i18n calls — heuristic: a real i18n key has at least one dot.
      if (!key.includes(".")) continue;
      usedKeys.add(key);
      if (!usagesByKey.has(key)) usagesByKey.set(key, []);
      usagesByKey.get(key)!.push(file);
    }
  }

  console.log(`[check-i18n-keys] ${usedKeys.size} keys referenced in code`);

  // Find missing keys (used but not in dictionary).
  const missing: Array<{ key: string; files: string[] }> = [];
  for (const key of usedKeys) {
    if (!dictKeys.has(key)) {
      missing.push({ key, files: usagesByKey.get(key) ?? [] });
    }
  }

  if (missing.length === 0) {
    console.log("[check-i18n-keys] ✓ All keys are defined.");
    process.exit(0);
  }

  console.error(`[check-i18n-keys] ✗ ${missing.length} keys used but not defined:`);
  for (const { key, files } of missing) {
    console.error(`  ${key}`);
    for (const f of files.slice(0, 3)) {
      console.error(`    └─ ${path.relative(process.cwd(), f)}`);
    }
    if (files.length > 3) {
      console.error(`    └─ ...and ${files.length - 3} more`);
    }
  }
  process.exit(1);
}

main().catch((err) => {
  console.error("[check-i18n-keys] FAILED:", err);
  process.exit(2);
});

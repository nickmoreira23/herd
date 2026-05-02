import { danger, warn, message } from "danger";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const modified = danger.git.modified_files;
const created = danger.git.created_files;
const all = [...modified, ...created];

// ---------------------------------------------------------------------------
// S1: Bilingual co-change
// ---------------------------------------------------------------------------
const ptBRChanged = new Set(
  all
    .filter((f) => f.endsWith("/pt-BR.md") && f.startsWith("docs/handbook/"))
    .map((f) => f.replace(/\/pt-BR\.md$/, "")),
);
const enUSChanged = new Set(
  all
    .filter((f) => f.endsWith("/en-US.md") && f.startsWith("docs/handbook/"))
    .map((f) => f.replace(/\/en-US\.md$/, "")),
);

for (const dir of ptBRChanged) {
  if (!enUSChanged.has(dir)) {
    warn(
      `**Bilingual co-change**: \`${dir}/pt-BR.md\` changed but \`${dir}/en-US.md\` was not. Update both locales together, or add \`<!-- TRANSLATION_PENDING -->\` in the lagging locale and tag the PR \`i18n-followup\`.`,
    );
  }
}
for (const dir of enUSChanged) {
  if (!ptBRChanged.has(dir)) {
    warn(
      `**Bilingual co-change**: \`${dir}/en-US.md\` changed but \`${dir}/pt-BR.md\` was not. Update both locales together, or add \`<!-- TRANSLATION_PENDING -->\` in the lagging locale and tag the PR \`i18n-followup\`.`,
    );
  }
}

// ---------------------------------------------------------------------------
// S2: Doc-first nudge
// ---------------------------------------------------------------------------
const sourceChanged = all.some(
  (f) =>
    /^src\/(lib|components|app\/admin|app\/api)\//.test(f) &&
    !f.includes("/__tests__/") &&
    !f.endsWith(".test.ts") &&
    !f.endsWith(".test.tsx") &&
    !f.endsWith(".integration.test.ts") &&
    !f.endsWith(".integration.test.tsx"),
);
const handbookChanged = all.some((f) => f.startsWith("docs/handbook/"));

if (sourceChanged && !handbookChanged) {
  message(
    `**Doc-first nudge**: source code under \`src/\` changed but no \`docs/handbook/\` updates in this PR. If you're modifying a feature that has a Handbook entry, the entry probably needs an update too. If this is genuinely a no-doc change (refactor, internal cleanup), feel free to ignore.`,
  );
}

// ---------------------------------------------------------------------------
// S3: Allowlist non-growth
// ---------------------------------------------------------------------------
const allowlistPath = "docs/handbook/_meta/.legacy-allowlist.txt";
if (existsSync(allowlistPath)) {
  try {
    const baseRef = danger.github.pr.base.sha;
    const baseContent = execSync(
      `git show ${baseRef}:${allowlistPath} 2>/dev/null || echo ''`,
      { encoding: "utf-8" },
    ).toString();
    const headContent = readFileSync(allowlistPath, "utf-8");

    const parseLines = (content: string): Set<string> =>
      new Set(
        content
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("#")),
      );

    const baseLines = parseLines(baseContent);
    const headLines = parseLines(headContent);

    const added: string[] = [];
    for (const line of headLines) {
      if (!baseLines.has(line)) added.push(line);
    }

    if (added.length > 0) {
      warn(
        `**Allowlist grew (${added.length} new entries)**: \`${allowlistPath}\` is meant to only shrink. New entries:\n${added.map((l) => `- \`${l}\``).join("\n")}\n\nIf you're introducing a new dangling reference, consider creating the missing \`feature.yml\` instead. The allowlist is for backfill, not greenfield.`,
      );
    }
  } catch {
    // Base ref may not be accessible (rare); skip silently.
  }
}
